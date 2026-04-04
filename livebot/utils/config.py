import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MT5
    MT5_LOGIN    = int(os.getenv("MT5_LOGIN", 0))
    MT5_PASSWORD = os.getenv("MT5_PASSWORD", "")
    MT5_SERVER   = os.getenv("MT5_SERVER", "Exness-MT5Real")

    # Symbol & Timeframe
    SYMBOL        = os.getenv("SYMBOL", "XAUUSD")
    TIMEFRAME_STR = os.getenv("TIMEFRAME", "M5")

    # Risk
    LOT_SIZE     = float(os.getenv("LOT_SIZE", 0.01))
    RISK_PERCENT = float(os.getenv("RISK_PERCENT", 0.5))  # % of balance per trade
    SL_ATR_MULT  = 1.5   # SL = ATR * this
    TP_ATR_MULT  = 2.5   # TP = ATR * this
    SLIPPAGE     = 10

    # Signal thresholds
    CONFIDENCE_THRESHOLD = 0.60
    REVERSAL_THRESHOLD   = 0.70

    # Breakeven trigger: move SL to BE after gaining X * SL_dist
    BREAKEVEN_R = 1.0

    # Loop
    LOOP_INTERVAL = int(os.getenv("LOOP_INTERVAL", 60))  # seconds

    # News
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

    # MT5 Timeframe map
    TF_MAP = {
        "M1": 1, "M5": 5, "M15": 15, "M30": 30,
        "H1": 16385, "H4": 16388, "D1": 16408,
    }

    @classmethod
    def get_tf(cls):
        return cls.TF_MAP.get(cls.TIMEFRAME_STR, 5)
