"""ExecutionAgent — full MT5 order lifecycle: open, close, modify, breakeven, reversal."""
import time
from dataclasses import dataclass
from typing import Optional
from utils.logger import get_logger
from utils.config import Config

log = get_logger("ExecutionAgent")


@dataclass
class TradeState:
    ticket:    int   = 0
    direction: str   = ""
    entry:     float = 0.0
    sl:        float = 0.0
    tp:        float = 0.0
    lot:       float = 0.0
    be_moved:  bool  = False


class ExecutionAgent:
    def __init__(self):
        self.state   = TradeState()
        self._mt5_ok = False
        self._try_init()

    def _try_init(self):
        try:
            import MetaTrader5 as mt5
            self._mt5    = mt5
            self._mt5_ok = True
            log.info("ExecutionAgent: MT5 module loaded ✔")
        except ImportError:
            log.warning("ExecutionAgent: MT5 not available — SIMULATION MODE")

    # ── Main manage loop ──────────────────────────────────────────────────────
    def manage(self, signal: str, confidence: float,
               atr: float, current_price: float) -> str:
        log.info(f"▶ ExecutionAgent.manage  signal={signal}  "
                 f"conf={confidence:.3f}  atr={atr:.4f}  price={current_price:.5f}")

        if self.state.ticket and not self._position_exists(self.state.ticket):
            log.info(f"  · Position {self.state.ticket} closed by SL/TP — resetting")
            self._reset_state()

        has_pos = bool(self.state.ticket)

        if not has_pos:
            if signal in ("BUY", "SELL") and confidence >= Config.CONFIDENCE_THRESHOLD:
                return self._open_position(signal, atr, current_price)
            log.debug(f"  · No position, signal={signal} conf={confidence:.3f} — HOLD")
            return "HOLD"

        direction = self.state.direction

        if confidence < Config.CONFIDENCE_THRESHOLD:
            log.info(f"  · Confidence dropped to {confidence:.3f} — closing")
            return self._close_position("LOW_CONF")

        if signal != direction and signal in ("BUY", "SELL") \
                and confidence >= Config.REVERSAL_THRESHOLD:
            log.info(f"  · Reversal {direction}→{signal}  conf={confidence:.3f}")
            self._close_position("REVERSAL")
            time.sleep(0.5)
            return self._open_position(signal, atr, current_price)

        be = self._check_breakeven(current_price, atr)
        if be:
            return be

        mod = self._check_modify(current_price, atr)
        if mod:
            return mod

        log.debug(f"  · Holding ticket={self.state.ticket}  dir={direction}")
        return "HOLD"

    # ── Open ──────────────────────────────────────────────────────────────────
    def _open_position(self, direction: str, atr: float, price: float) -> str:
        sl_dist = atr * Config.SL_ATR_MULT
        tp_dist = atr * Config.TP_ATR_MULT
        lot     = self._calc_lot(sl_dist)

        sl = price - sl_dist if direction == "BUY" else price + sl_dist
        tp = price + tp_dist if direction == "BUY" else price - tp_dist

        log.info(f"  ▶ OPEN {direction}  lot={lot}  price={price:.5f}  "
                 f"SL={sl:.5f}  TP={tp:.5f}  (ATR={atr:.4f})")

        if self._mt5_ok:
            ticket = self._mt5_send_order(direction, lot, sl, tp, price)
        else:
            ticket = int(time.time())
            log.warning(f"  ⚠ SIMULATION: fake ticket {ticket}")

        if ticket:
            self.state = TradeState(
                ticket=ticket, direction=direction,
                entry=price, sl=sl, tp=tp, lot=lot
            )
            log.info(f"  ✔ Opened ticket={ticket}")
            return f"OPEN_{direction}"
        log.error("  ✖ Order failed")
        return "OPEN_FAILED"

    # ── Close ─────────────────────────────────────────────────────────────────
    def _close_position(self, reason: str = "") -> str:
        ticket = self.state.ticket
        log.info(f"  ▶ CLOSE  ticket={ticket}  reason={reason}")
        if self._mt5_ok:
            self._mt5_close(ticket, self.state.direction, self.state.lot)
        else:
            log.warning(f"  ⚠ SIMULATION: closed ticket {ticket}")
        self._reset_state()
        return "CLOSE"

    # ── Breakeven ─────────────────────────────────────────────────────────────
    def _check_breakeven(self, price: float, atr: float) -> Optional[str]:
        if self.state.be_moved:
            return None
        entry   = self.state.entry
        trigger = atr * Config.SL_ATR_MULT * Config.BREAKEVEN_R

        if self.state.direction == "BUY" and price >= entry + trigger:
            new_sl = entry + atr * 0.1
            log.info(f"  ▶ BREAKEVEN  ticket={self.state.ticket}  new_SL={new_sl:.5f}")
            self._modify_sl_tp(self.state.ticket, new_sl, self.state.tp)
            self.state.sl = new_sl
            self.state.be_moved = True
            return "BREAKEVEN"
        elif self.state.direction == "SELL" and price <= entry - trigger:
            new_sl = entry - atr * 0.1
            log.info(f"  ▶ BREAKEVEN  ticket={self.state.ticket}  new_SL={new_sl:.5f}")
            self._modify_sl_tp(self.state.ticket, new_sl, self.state.tp)
            self.state.sl = new_sl
            self.state.be_moved = True
            return "BREAKEVEN"
        return None

    # ── ATR drift modify ──────────────────────────────────────────────────────
    def _check_modify(self, price: float, atr: float) -> Optional[str]:
        original_atr = abs(self.state.tp - self.state.entry) / Config.TP_ATR_MULT
        if original_atr == 0:
            return None
        drift = abs(atr - original_atr) / original_atr
        if drift > 0.20:
            new_tp = (price + atr * Config.TP_ATR_MULT
                      if self.state.direction == "BUY"
                      else price - atr * Config.TP_ATR_MULT)
            log.info(f"  ▶ MODIFY  ATR_drift={drift*100:.1f}%  new_TP={new_tp:.5f}")
            self._modify_sl_tp(self.state.ticket, self.state.sl, new_tp)
            self.state.tp = new_tp
            return "MODIFY"
        return None

    # ── Lot sizing ────────────────────────────────────────────────────────────
    def _calc_lot(self, sl_dist: float) -> float:
        if not self._mt5_ok:
            return Config.LOT_SIZE
        try:
            mt5      = self._mt5
            balance  = mt5.account_info().balance
            risk_amt = balance * Config.RISK_PERCENT / 100
            sym      = mt5.symbol_info(Config.SYMBOL)
            if sym is None:
                return Config.LOT_SIZE
            lot = risk_amt / (sl_dist / sym.trade_tick_size * sym.trade_tick_value)
            lot = round(max(sym.volume_min, min(sym.volume_max, lot)), 2)
            log.debug(f"  · lot={lot}  balance={balance}  risk={risk_amt:.2f}")
            return lot
        except Exception as e:
            log.warning(f"  · lot calc failed: {e} — default {Config.LOT_SIZE}")
            return Config.LOT_SIZE

    # ── MT5 wrappers ──────────────────────────────────────────────────────────
    def _mt5_send_order(self, direction, lot, sl, tp, price) -> int:
        mt5 = self._mt5
        otype = mt5.ORDER_TYPE_BUY if direction == "BUY" else mt5.ORDER_TYPE_SELL
        tick  = mt5.symbol_info_tick(Config.SYMBOL)
        ep    = tick.ask if direction == "BUY" else tick.bid
        req = {
            "action": mt5.TRADE_ACTION_DEAL, "symbol": Config.SYMBOL,
            "volume": lot, "type": otype, "price": ep,
            "sl": sl, "tp": tp, "deviation": Config.SLIPPAGE,
            "magic": 20260404, "comment": "LiveBot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        res = mt5.order_send(req)
        if res.retcode != mt5.TRADE_RETCODE_DONE:
            log.error(f"  ✖ order_send retcode={res.retcode} comment={res.comment}")
            return 0
        return res.order

    def _mt5_close(self, ticket, direction, lot):
        mt5   = self._mt5
        otype = mt5.ORDER_TYPE_SELL if direction == "BUY" else mt5.ORDER_TYPE_BUY
        tick  = mt5.symbol_info_tick(Config.SYMBOL)
        price = tick.bid if direction == "BUY" else tick.ask
        req = {
            "action": mt5.TRADE_ACTION_DEAL, "symbol": Config.SYMBOL,
            "volume": lot, "type": otype, "position": ticket,
            "price": price, "deviation": Config.SLIPPAGE,
            "magic": 20260404, "comment": "LiveBot_close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        res = mt5.order_send(req)
        if res.retcode != mt5.TRADE_RETCODE_DONE:
            log.error(f"  ✖ close retcode={res.retcode}")
        else:
            log.info(f"  ✔ Position closed ticket={ticket}")

    def _modify_sl_tp(self, ticket, new_sl, new_tp):
        if not self._mt5_ok:
            log.warning(f"  ⚠ SIMULATION: modify ticket={ticket}")
            return
        req = {
            "action": self._mt5.TRADE_ACTION_SLTP,
            "symbol": Config.SYMBOL, "position": ticket,
            "sl": new_sl, "tp": new_tp,
        }
        res = self._mt5.order_send(req)
        if res.retcode != self._mt5.TRADE_RETCODE_DONE:
            log.error(f"  ✖ modify retcode={res.retcode}")

    def _position_exists(self, ticket: int) -> bool:
        if not self._mt5_ok:
            return True
        pos = self._mt5.positions_get(ticket=ticket)
        return pos is not None and len(pos) > 0

    def _reset_state(self):
        self.state = TradeState()
