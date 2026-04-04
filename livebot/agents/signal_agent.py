"""SignalAgent — BUY / SELL / HOLD with multi-factor confidence + sentiment injection."""
import numpy as np
import pandas as pd
from utils.logger import get_logger
from utils.config import Config
from sentiment.sentiment_agent import SentimentResult

log = get_logger("SignalAgent")


class SignalResult:
    def __init__(self, signal, raw_conf, final_conf, reason, sentiment):
        self.signal      = signal
        self.raw_conf    = raw_conf
        self.confidence  = final_conf
        self.reason      = reason
        self.sentiment   = sentiment

    def __repr__(self):
        return (f"SignalResult(signal={self.signal} conf={self.confidence:.3f} "
                f"sent={self.sentiment.label})")


class SignalAgent:
    def generate(self, df: pd.DataFrame,
                 sentiment: SentimentResult) -> SignalResult:
        log.info("▶ Generating signal …")
        row  = df.iloc[-1]
        prev = df.iloc[-2] if len(df) > 2 else row

        votes_bull, votes_bear = 0.0, 0.0
        reasons = []

        # 1. EMA stack
        ema9, ema21, ema50 = row["ema9"], row["ema21"], row["ema50"]
        if ema9 > ema21 > ema50:
            votes_bull += 1.5; reasons.append("EMA_BULL_STACK")
        elif ema9 < ema21 < ema50:
            votes_bear += 1.5; reasons.append("EMA_BEAR_STACK")

        # 2. RSI
        rsi = row["rsi"]
        if 50 < rsi < 70:
            votes_bull += 1.0; reasons.append(f"RSI_BULL({rsi:.1f})")
        elif rsi > 70:
            votes_bear += 0.5; reasons.append(f"RSI_OB({rsi:.1f})")
        elif 30 < rsi < 50:
            votes_bear += 1.0; reasons.append(f"RSI_BEAR({rsi:.1f})")
        elif rsi < 30:
            votes_bull += 0.5; reasons.append(f"RSI_OS({rsi:.1f})")

        # 3. MACD crossover
        if row["macd"] > row["macd_signal"] and prev["macd"] <= prev["macd_signal"]:
            votes_bull += 2.0; reasons.append("MACD_CROSS_UP")
        elif row["macd"] < row["macd_signal"] and prev["macd"] >= prev["macd_signal"]:
            votes_bear += 2.0; reasons.append("MACD_CROSS_DOWN")
        elif row["osma"] > 0:
            votes_bull += 0.5; reasons.append("OSMA_POS")
        else:
            votes_bear += 0.5; reasons.append("OSMA_NEG")

        # 4. ADX
        adx = row["adx"]
        if adx > 25:
            if row["adx_pos"] > row["adx_neg"]:
                votes_bull += 1.0; reasons.append(f"ADX_BULL({adx:.1f})")
            else:
                votes_bear += 1.0; reasons.append(f"ADX_BEAR({adx:.1f})")

        # 5. Ichimoku
        price        = row["Close"]
        cloud_top    = max(row["ichi_a"], row["ichi_b"])
        cloud_bottom = min(row["ichi_a"], row["ichi_b"])
        if price > cloud_top and row["ichi_conv"] > row["ichi_base"]:
            votes_bull += 1.5; reasons.append("ICHI_BULL")
        elif price < cloud_bottom and row["ichi_conv"] < row["ichi_base"]:
            votes_bear += 1.5; reasons.append("ICHI_BEAR")

        # 6. Stochastic
        sk, sd = row["stoch_k"], row["stoch_d"]
        if sk > sd and sk < 80:
            votes_bull += 0.5; reasons.append("STOCH_BULL")
        elif sk < sd and sk > 20:
            votes_bear += 0.5; reasons.append("STOCH_BEAR")

        # 7. Bollinger breakout
        if price > row["bb_upper"]:
            votes_bull += 1.0; reasons.append("BB_BREAKOUT_UP")
        elif price < row["bb_lower"]:
            votes_bear += 1.0; reasons.append("BB_BREAKOUT_DOWN")

        # 8. Regime filter
        regime = row["regime"]
        if regime == "RANGE":
            votes_bull *= 0.6; votes_bear *= 0.6
            reasons.append("REGIME_RANGE_DAMPENED")
        elif regime == "VOLATILE":
            votes_bull *= 0.4; votes_bear *= 0.4
            reasons.append("REGIME_VOLATILE_DAMPENED")

        # Raw confidence
        total = votes_bull + votes_bear
        if total == 0:
            raw_conf, signal = 0.50, "HOLD"
        elif votes_bull > votes_bear:
            raw_conf = votes_bull / total
            signal   = "BUY"
        else:
            raw_conf = votes_bear / total
            signal   = "SELL"

        # Sentiment adjustment
        sent_adj = sentiment.confidence_adj
        if signal == "BUY":
            final_conf = raw_conf + (sent_adj if sent_adj > 0 else sent_adj * 0.5)
        elif signal == "SELL":
            final_conf = raw_conf + (-sent_adj if sent_adj < 0 else sent_adj * 0.5)
        else:
            final_conf = raw_conf

        final_conf = max(0.40, min(0.99, final_conf))

        reason_str = " | ".join(reasons)
        log.info(f"✔ Signal={signal}  raw_conf={raw_conf:.3f}  "
                 f"sent_adj={sent_adj:+.3f}  final={final_conf:.3f}")
        log.debug(f"  · votes  bull={votes_bull:.1f}  bear={votes_bear:.1f}")
        log.debug(f"  · factors: {reason_str}")

        return SignalResult(
            signal=signal if final_conf >= Config.CONFIDENCE_THRESHOLD else "HOLD",
            raw_conf=round(raw_conf, 4),
            final_conf=round(final_conf, 4),
            reason=reason_str,
            sentiment=sentiment
        )
