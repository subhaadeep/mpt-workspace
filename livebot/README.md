# LiveBot — Live Market Trading Bot

Full-stack autonomous trading bot for **XAUUSD** (Gold) on **MT5 / Exness**.

## Architecture

```
meta.py  ←  main entry point
  │
  ├── DataAgent         — MT5 live bars or CSV fallback
  ├── IndicatorAgent    — ATR, BB, RSI, EMA9/21/50/200, MACD, OSMA, ADX, Ichimoku, Stoch, OBV + Regime
  ├── SentimentAgent    — NewsAPI NLP + CNN Fear&Greed + VIX + DXY (cached 5 min)
  ├── SignalAgent       — 8-factor voting engine with sentiment confidence injection
  └── ExecutionAgent    — Open / Close / Breakeven / Modify / Reversal via MT5
```

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env          # fill your credentials
python meta.py download       # (optional) download 5-year M1 history
python meta.py                # start live bot
```

## Sentiment Sources

| Source | Impact on Gold |
|---|---|
| NewsAPI headlines (NLP) | inflation / rate / geopolitical keywords |
| CNN Fear & Greed | Fear → bullish, Greed → bearish |
| VIX | VIX >30 = safe-haven demand = bullish |
| DXY 3-day change | Rising USD = bearish Gold (inverse) |

Sentiment is **never overrides technicals** — it shifts confidence by max ±8%.

## Config Reference (`.env`)

| Key | Default | Description |
|---|---|---|
| `MT5_LOGIN` | — | Your MT5 account number |
| `MT5_PASSWORD` | — | MT5 password |
| `MT5_SERVER` | Exness-MT5Real | MT5 server name |
| `SYMBOL` | XAUUSD | Trading symbol |
| `TIMEFRAME` | M5 | Bar timeframe |
| `LOT_SIZE` | 0.01 | Default lot (used if dynamic sizing fails) |
| `RISK_PERCENT` | 0.5 | % of balance risked per trade |
| `NEWS_API_KEY` | — | newsapi.org free key |
| `LOOP_INTERVAL` | 60 | Seconds between cycles |

## Safety Rules

- Start with `LOT_SIZE=0.01` and `RISK_PERCENT=0.5`
- Watch first 20 cycles manually
- All decisions are logged to `logs/live_YYYYMMDD.log`
- Bot handles SIGINT/SIGTERM gracefully — closes open positions on exit
- If MT5 is unavailable, runs in **SIMULATION MODE** (no real orders)
