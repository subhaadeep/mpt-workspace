"""SentimentAgent — multi-source market sentiment for XAUUSD.

Sources:
  1. NewsAPI  — NLP on latest headlines (VADER + TextBlob)
  2. CNN Fear & Greed index (web scrape)
  3. VIX proxy  — risk-off/on via Yahoo Finance
  4. DXY proxy  — USD strength inverse relationship with Gold

Sentiment refreshes every CACHE_TTL seconds (default 300s = 5 min).
All sources are optional — if a source fails, it is skipped gracefully.
"""
import time
import re
import json
import requests
from dataclasses import dataclass
from typing import List, Tuple
from utils.logger import get_logger
from utils.config import Config

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER = SentimentIntensityAnalyzer()
except ImportError:
    VADER = None

try:
    from textblob import TextBlob
    HAS_TB = True
except ImportError:
    HAS_TB = False

log = get_logger("SentimentAgent")

CACHE_TTL = 300   # seconds

# Keywords that directly impact Gold
GOLD_BULL_KEYWORDS = [
    "inflation", "rate cut", "fed pause", "geopolitical", "war", "crisis",
    "recession", "safe haven", "gold rally", "dollar weakness", "rate hold",
    "debt ceiling", "banking collapse", "uncertainty"
]
GOLD_BEAR_KEYWORDS = [
    "rate hike", "dollar strength", "risk on", "hawkish", "fed hike",
    "gold sell", "gold drop", "strong dollar", "yield rise"
]


@dataclass
class SentimentResult:
    score:          float    # -1.0 (very bearish) to +1.0 (very bullish)
    label:          str      # VERY_BULLISH | BULLISH | NEUTRAL | BEARISH | VERY_BEARISH
    confidence_adj: float    # confidence adjustment passed to SignalAgent
    sources:        dict     # per-source breakdown
    timestamp:      float    # unix time of last refresh

    def __repr__(self):
        return (f"SentimentResult(label={self.label} score={self.score:+.3f} "
                f"conf_adj={self.confidence_adj:+.3f})")


class SentimentAgent:
    def __init__(self):
        self._cache: SentimentResult | None = None
        self._last_fetch = 0.0

    def get_sentiment(self) -> SentimentResult:
        if self._cache and (time.time() - self._last_fetch) < CACHE_TTL:
            age = int(time.time() - self._last_fetch)
            log.debug(f"Sentiment cache hit  age={age}s  {self._cache}")
            return self._cache
        result = self._fetch_all()
        self._cache = result
        self._last_fetch = time.time()
        log.info(f"Sentiment refreshed  {result}")
        log.debug(f"  sources: {result.sources}")
        return result

    # ── Main aggregator ───────────────────────────────────────────────────────
    def _fetch_all(self) -> SentimentResult:
        sources = {}
        weighted_scores: List[Tuple[float, float]] = []  # (score, weight)

        # 1. News NLP
        n_score, n_detail = self._news_sentiment()
        sources["news"] = {"score": round(n_score, 4), **n_detail}
        if n_detail.get("articles", 0) > 0:
            weighted_scores.append((n_score, 1.5))
        else:
            log.warning("News sentiment skipped (no articles)")

        # 2. Fear & Greed
        fg_score, fg_raw = self._fear_greed()
        sources["fear_greed"] = {"score": round(fg_score, 4), "raw": fg_raw}
        if fg_raw is not None:
            weighted_scores.append((fg_score, 1.0))

        # 3. VIX proxy
        vix_score, vix_val = self._vix_proxy()
        sources["vix"] = {"score": round(vix_score, 4), "value": vix_val}
        if vix_val is not None:
            weighted_scores.append((vix_score, 0.8))

        # 4. DXY proxy
        dxy_score, dxy_chg = self._dxy_proxy()
        sources["dxy"] = {"score": round(dxy_score, 4), "3d_chg": dxy_chg}
        if dxy_chg is not None:
            weighted_scores.append((dxy_score, 1.0))

        # Weighted average
        if not weighted_scores:
            final_score = 0.0
        else:
            total_w = sum(w for _, w in weighted_scores)
            final_score = sum(s * w for s, w in weighted_scores) / total_w
            final_score = max(-1.0, min(1.0, final_score))

        label = self._score_to_label(final_score)
        conf_adj = final_score * 0.08   # max ±8% confidence shift

        return SentimentResult(
            score=round(final_score, 4),
            label=label,
            confidence_adj=round(conf_adj, 4),
            sources=sources,
            timestamp=time.time()
        )

    # ── Source 1: NewsAPI ─────────────────────────────────────────────────────
    def _news_sentiment(self) -> Tuple[float, dict]:
        key = Config.NEWS_API_KEY
        if not key:
            log.debug("NewsAPI key not set — skipping")
            return 0.0, {"articles": 0, "reason": "no_key"}

        queries = ["gold price", "XAUUSD", "Federal Reserve interest rates",
                   "inflation CPI", "US dollar DXY"]
        all_titles: List[str] = []

        for q in queries:
            try:
                url = ("https://newsapi.org/v2/everything"
                       f"?q={requests.utils.quote(q)}"
                       "&language=en&sortBy=publishedAt&pageSize=5"
                       f"&apiKey={key}")
                r = requests.get(url, timeout=6)
                if r.status_code == 200:
                    arts = r.json().get("articles", [])
                    all_titles += [a.get("title", "") + " " +
                                   (a.get("description") or "")
                                   for a in arts]
            except Exception as e:
                log.debug(f"NewsAPI query '{q}' failed: {e}")

        if not all_titles:
            return 0.0, {"articles": 0}

        scores = []
        bull_hits, bear_hits = 0, 0

        for text in all_titles:
            tl = text.lower()
            # Keyword boost
            kw_score = 0.0
            for kw in GOLD_BULL_KEYWORDS:
                if kw in tl:
                    kw_score += 0.15
                    bull_hits += 1
            for kw in GOLD_BEAR_KEYWORDS:
                if kw in tl:
                    kw_score -= 0.15
                    bear_hits += 1

            # VADER
            if VADER:
                vs = VADER.polarity_scores(text)["compound"]
            else:
                vs = 0.0

            # TextBlob
            if HAS_TB:
                tb = TextBlob(text).sentiment.polarity
            else:
                tb = 0.0

            nlp_score = (vs + tb) / 2
            final     = max(-1.0, min(1.0, nlp_score * 0.6 + kw_score * 0.4))
            scores.append(final)

        avg = sum(scores) / len(scores)
        log.debug(f"  · News: {len(all_titles)} articles  "
                  f"avg={avg:.3f}  bull_kw={bull_hits}  bear_kw={bear_hits}")
        return avg, {"articles": len(all_titles),
                     "bull_keywords": bull_hits, "bear_keywords": bear_hits}

    # ── Source 2: Fear & Greed (CNN) ──────────────────────────────────────────
    def _fear_greed(self) -> Tuple[float, object]:
        try:
            url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
            r = requests.get(url, timeout=5,
                             headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                data  = r.json()
                score = float(data["fear_and_greed"]["score"])  # 0–100
                # Gold is inversely correlated to greed
                # High fear (0-30) → bullish Gold
                # High greed (70-100) → bearish Gold
                normalized = (50 - score) / 50   # fear=+1.0, greed=-1.0
                log.debug(f"  · Fear&Greed raw={score:.1f}  gold_adj={normalized:.3f}")
                return normalized, score
        except Exception as e:
            log.debug(f"Fear&Greed fetch failed: {e}")
        return 0.0, None

    # ── Source 3: VIX proxy ───────────────────────────────────────────────────
    def _vix_proxy(self) -> Tuple[float, object]:
        try:
            url = ("https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX"
                   "?interval=1d&range=5d")
            r = requests.get(url, timeout=6,
                             headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                closes = r.json()["chart"]["result"][0]["indicators"]["quote"][0]["close"]
                closes = [c for c in closes if c is not None]
                vix = closes[-1]
                # VIX > 30 = high fear = safe-haven demand = bullish Gold
                # VIX < 15 = complacency = bearish Gold
                if vix > 30:
                    score = min(1.0, (vix - 30) / 20)
                elif vix < 15:
                    score = max(-0.5, (vix - 15) / 15)
                else:
                    score = (vix - 22.5) / 15   # neutral around 22.5
                score = max(-1.0, min(1.0, score))
                log.debug(f"  · VIX={vix:.1f}  gold_adj={score:.3f}")
                return score, round(vix, 2)
        except Exception as e:
            log.debug(f"VIX fetch failed: {e}")
        return 0.0, None

    # ── Source 4: DXY proxy ───────────────────────────────────────────────────
    def _dxy_proxy(self) -> Tuple[float, object]:
        try:
            url = ("https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB"
                   "?interval=1d&range=5d")
            r = requests.get(url, timeout=6,
                             headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                closes = r.json()["chart"]["result"][0]["indicators"]["quote"][0]["close"]
                closes = [c for c in closes if c is not None]
                if len(closes) >= 3:
                    chg_pct = (closes[-1] - closes[-3]) / closes[-3] * 100
                    # DXY rising → Gold bearish (inverse)
                    score = max(-1.0, min(1.0, -chg_pct / 1.5))
                    log.debug(f"  · DXY 3d_chg={chg_pct:.2f}%  gold_adj={score:.3f}")
                    return score, round(chg_pct, 4)
        except Exception as e:
            log.debug(f"DXY fetch failed: {e}")
        return 0.0, None

    # ── Label mapping ─────────────────────────────────────────────────────────
    @staticmethod
    def _score_to_label(score: float) -> str:
        if score >= 0.50:  return "VERY_BULLISH"
        if score >= 0.20:  return "BULLISH"
        if score >= -0.20: return "NEUTRAL"
        if score >= -0.50: return "BEARISH"
        return "VERY_BEARISH"
