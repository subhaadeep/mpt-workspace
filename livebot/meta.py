"""meta.py — Main entry point for the Live Trading Bot."""
import time, sys, signal, os
from utils.logger  import get_logger
from utils.config  import Config
from data.data_agent            import DataAgent
from agents.indicator_agent     import IndicatorAgent
from agents.signal_agent        import SignalAgent
from execution.execution_agent  import ExecutionAgent
from sentiment.sentiment_agent  import SentimentAgent

log = get_logger("meta")


def run_live_loop():
    log.info("=" * 60)
    log.info("  LIVE TRADING BOT STARTING")
    log.info(f"  Symbol    : {Config.SYMBOL}")
    log.info(f"  Timeframe : {Config.TIMEFRAME_STR}")
    log.info(f"  Lot Size  : {Config.LOT_SIZE}")
    log.info(f"  Risk      : {Config.RISK_PERCENT}%")
    log.info(f"  Loop Interval: {Config.LOOP_INTERVAL}s")
    log.info("=" * 60)

    data_agent      = DataAgent()
    indicator_agent = IndicatorAgent()
    signal_agent    = SignalAgent()
    execution_agent = ExecutionAgent()
    sentiment_agent = SentimentAgent()

    cycle = 0

    def shutdown(sig, frame):
        log.warning("⚠ Shutdown signal — closing open positions …")
        if execution_agent.state.ticket:
            execution_agent._close_position("SHUTDOWN")
        log.info("Bot stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT,  shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        cycle += 1
        t_start = time.time()
        log.info(f"\n{'─'*50}\n  CYCLE {cycle}   {time.strftime('%Y-%m-%d %H:%M:%S')}\n{'─'*50}")

        try:
            # 1 — Fetch data
            df = data_agent.fetch_bars(n=500)
            if df is None or df.empty:
                log.error("No data — skipping cycle")
                time.sleep(Config.LOOP_INTERVAL)
                continue

            # 2 — Indicators
            df = indicator_agent.compute(df)
            if df.empty:
                log.error("Indicators returned empty df — skipping")
                time.sleep(Config.LOOP_INTERVAL)
                continue

            # 3 — Sentiment
            sentiment = sentiment_agent.get_sentiment()

            # 4 — Signal
            result = signal_agent.generate(df, sentiment)
            log.info(f"📊 Signal={result.signal}  "
                     f"Confidence={result.confidence:.3f}  "
                     f"Sentiment={result.sentiment.label}({result.sentiment.score:+.2f})")

            # 5 — Execution
            atr   = float(df["atr"].iloc[-1])
            price = float(df["Close"].iloc[-1])
            action = execution_agent.manage(
                signal=result.signal,
                confidence=result.confidence,
                atr=atr,
                current_price=price
            )
            log.info(f"⚡ Action={action}  "
                     f"ticket={execution_agent.state.ticket}  "
                     f"dir={execution_agent.state.direction}")

        except KeyboardInterrupt:
            shutdown(None, None)
        except Exception as e:
            log.exception(f"✖ Cycle {cycle} error: {e}")

        elapsed = time.time() - t_start
        sleep   = max(1, Config.LOOP_INTERVAL - elapsed)
        log.info(f"  Cycle took {elapsed:.1f}s — sleeping {sleep:.0f}s …\n")
        time.sleep(sleep)


def download_csv():
    da = DataAgent()
    da.download_5y_m1()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "download":
        download_csv()
    else:
        run_live_loop()
