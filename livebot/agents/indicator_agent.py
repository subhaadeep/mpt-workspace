"""IndicatorAgent — computes all technical indicators with step-by-step logging."""
import time
import pandas as pd
import numpy as np
import ta
from utils.logger import get_logger

log = get_logger("IndicatorAgent")


class IndicatorAgent:
    def compute(self, df: pd.DataFrame) -> pd.DataFrame:
        log.info("▶ Computing indicators …")
        t0 = time.time()
        df = df.copy()

        log.debug("  · ATR / volatility")
        df["atr"] = ta.volatility.AverageTrueRange(
            df["High"], df["Low"], df["Close"], window=14).average_true_range()
        df["bb_upper"] = ta.volatility.BollingerBands(df["Close"], 20, 2).bollinger_hband()
        df["bb_lower"] = ta.volatility.BollingerBands(df["Close"], 20, 2).bollinger_lband()
        df["bb_mid"]   = ta.volatility.BollingerBands(df["Close"], 20, 2).bollinger_mavg()

        log.debug("  · RSI")
        df["rsi"]      = ta.momentum.RSIIndicator(df["Close"], window=14).rsi()
        df["rsi_fast"] = ta.momentum.RSIIndicator(df["Close"], window=7).rsi()

        log.debug("  · EMA / trend")
        for p in [9, 21, 50, 200]:
            df[f"ema{p}"] = ta.trend.EMAIndicator(df["Close"], window=p).ema_indicator()

        log.debug("  · MACD / OSMA")
        macd = ta.trend.MACD(df["Close"])
        df["macd"]        = macd.macd()
        df["macd_signal"] = macd.macd_signal()
        df["osma"]        = df["macd"] - df["macd_signal"]

        log.debug("  · ADX")
        adx = ta.trend.ADXIndicator(df["High"], df["Low"], df["Close"], window=14)
        df["adx"]     = adx.adx()
        df["adx_pos"] = adx.adx_pos()
        df["adx_neg"] = adx.adx_neg()

        log.debug("  · Ichimoku")
        ich = ta.trend.IchimokuIndicator(df["High"], df["Low"])
        df["ichi_conv"] = ich.ichimoku_conversion_line()
        df["ichi_base"] = ich.ichimoku_base_line()
        df["ichi_a"]    = ich.ichimoku_a()
        df["ichi_b"]    = ich.ichimoku_b()

        log.debug("  · Stochastic / Williams %R")
        stoch = ta.momentum.StochasticOscillator(df["High"], df["Low"], df["Close"])
        df["stoch_k"] = stoch.stoch()
        df["stoch_d"] = stoch.stoch_signal()
        df["willr"]   = ta.momentum.WilliamsRIndicator(
            df["High"], df["Low"], df["Close"]).williams_r()

        log.debug("  · Volume / OBV")
        df["obv"] = ta.volume.OnBalanceVolumeIndicator(
            df["Close"], df["Volume"]).on_balance_volume()

        log.debug("  · Market regime classifier")
        df["regime"] = self._classify_regime(df)

        df.dropna(inplace=True)
        regime = df["regime"].iloc[-1] if len(df) else "UNKNOWN"
        atr    = df["atr"].iloc[-1]    if len(df) else 0
        log.info(f"✔ Indicators done in {time.time()-t0:.1f}s  "
                 f"regime={regime}  ATR={atr:.4f}  rows={len(df)}")
        return df

    def _classify_regime(self, df: pd.DataFrame) -> pd.Series:
        bb_width = (df["bb_upper"] - df["bb_lower"]) / df["bb_mid"].replace(0, np.nan)
        adx = df["adx"]
        conditions = [
            (adx > 25) & (bb_width > bb_width.rolling(50).mean()),
            (adx < 20) & (bb_width < bb_width.rolling(50).mean()),
        ]
        choices = ["TREND", "RANGE"]
        regime  = np.select(conditions, choices, default="VOLATILE")
        return pd.Series(regime, index=df.index)
