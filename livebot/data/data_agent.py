"""DataAgent — fetches live OHLCV bars from MT5 or falls back to CSV."""
import os
import time
import pandas as pd
from utils.logger import get_logger
from utils.config import Config

log = get_logger("DataAgent")

HIST_DIR = os.path.join(os.path.dirname(__file__), "..", "historical_data")
os.makedirs(HIST_DIR, exist_ok=True)


class DataAgent:
    def __init__(self):
        self._mt5_ok = False
        self._mt5    = None
        self._try_init_mt5()

    def _try_init_mt5(self):
        try:
            import MetaTrader5 as mt5
            self._mt5 = mt5
            if not mt5.initialize(
                login=Config.MT5_LOGIN,
                password=Config.MT5_PASSWORD,
                server=Config.MT5_SERVER
            ):
                log.warning(f"MT5 init failed: {mt5.last_error()} — CSV fallback mode")
                return
            info = mt5.account_info()
            log.info(f"MT5 connected  account={info.login}  "
                     f"balance={info.balance}  currency={info.currency}")
            self._mt5_ok = True
        except ImportError:
            log.warning("MetaTrader5 not installed — CSV fallback mode")

    # ── Live bars ─────────────────────────────────────────────────────────────
    def fetch_bars(self, n: int = 500) -> pd.DataFrame:
        if self._mt5_ok:
            return self._fetch_mt5(n)
        return self._fetch_csv(n)

    def _fetch_mt5(self, n: int) -> pd.DataFrame:
        mt5 = self._mt5
        tf  = Config.get_tf()
        rates = mt5.copy_rates_from_pos(Config.SYMBOL, tf, 0, n)
        if rates is None or len(rates) == 0:
            log.error(f"MT5 copy_rates_from_pos returned nothing: {mt5.last_error()}")
            return pd.DataFrame()
        df = pd.DataFrame(rates)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        df.rename(columns={"time": "Date", "open": "Open", "high": "High",
                            "low": "Low", "close": "Close",
                            "tick_volume": "Volume"}, inplace=True)
        df.set_index("Date", inplace=True)
        log.info(f"MT5 bars fetched: {len(df)}  last={df.index[-1]}  "
                 f"close={df['Close'].iloc[-1]:.5f}")
        return df

    def _fetch_csv(self, n: int) -> pd.DataFrame:
        csvs = sorted([
            f for f in os.listdir(HIST_DIR) if f.endswith(".csv")
        ])
        if not csvs:
            log.error("No CSV files in historical_data/ and MT5 unavailable.")
            return pd.DataFrame()
        path = os.path.join(HIST_DIR, csvs[-1])
        log.info(f"CSV fallback: {path}")
        df = pd.read_csv(path, index_col=0, parse_dates=True)
        df.columns = [c.capitalize() for c in df.columns]
        return df.tail(n)

    # ── 5-year M1 CSV download ─────────────────────────────────────────────────
    def download_5y_m1(self):
        if not self._mt5_ok:
            log.error("MT5 not connected — cannot download history")
            return
        import datetime
        mt5  = self._mt5
        end  = datetime.datetime.now()
        start = end - datetime.timedelta(days=365 * 5)
        log.info(f"Downloading M1 history {start.date()} → {end.date()} …")
        rates = mt5.copy_rates_range(
            Config.SYMBOL, mt5.TIMEFRAME_M1, start, end
        )
        if rates is None:
            log.error(f"Download failed: {mt5.last_error()}")
            return
        df = pd.DataFrame(rates)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        df.rename(columns={"time": "Date", "open": "Open", "high": "High",
                            "low": "Low", "close": "Close",
                            "tick_volume": "Volume"}, inplace=True)
        fname = os.path.join(
            HIST_DIR,
            f"{Config.SYMBOL}_M1_{start.strftime('%Y%m%d')}_{end.strftime('%Y%m%d')}.csv"
        )
        df.to_csv(fname, index=False)
        log.info(f"Saved {len(df)} rows → {fname}")
