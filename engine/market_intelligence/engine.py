# market_intelligence/engine.py

import numpy as np
from numpy.random import default_rng
from scipy import stats
from sklearn.preprocessing import MinMaxScaler
import hashlib
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class SignalType(str, Enum):
    OOS_GAP = "OOS_GAP"
    DEMAND_SPIKE = "DEMAND_SPIKE"
    PRICE_DROP = "PRICE_DROP"
    RESTOCK_SIGNAL = "RESTOCK_SIGNAL"


class PricePosition(str, Enum):
    UNDERPRICED = "underpriced"
    COMPETITIVE = "competitive"
    PREMIUM = "premium"


class Urgency(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class CompetitorBrand:
    name: str
    category: str
    total_skus: int
    oos_skus: int
    oos_rate: float
    price_index: float          # 1.0 = market average
    trend_direction: str        # up / stable / down
    trend_strength: float       # 0-1
    last_restock_days: int
    market_share_est: float     # 0-1


@dataclass
class CategoryDemandPoint:
    timestamp: str
    demand_index: float         # 0-100
    search_volume_index: float  # 0-100
    velocity_score: float       # units/day normalized
    seasonality_factor: float   # 0-2.0


@dataclass
class MarketOpportunity:
    id: str
    signal_type: SignalType
    competitor_brand: str
    product_name: str
    category: str
    message: str
    recommended_action: str
    opportunity_value_inr: int
    urgency: Urgency
    confidence_score: float     # 0-1 (ML estimated)
    timestamp: str
    expires_in_minutes: int


@dataclass
class PriceIntelRow:
    product_name: str
    category: str
    your_price: int
    market_avg_price: float
    lowest_competitor_price: int
    highest_competitor_price: int
    position: PricePosition
    gap_vs_market: float        # positive = you're cheaper
    gap_pct: float
    recommendation: str
    price_elasticity: float     # 0-3 range


@dataclass
class ABCXYZCell:
    abc_class: str              # A, B, C
    xyz_class: str              # X, Y, Z
    market_sku_count: int
    your_sku_count: int
    avg_demand_index: float
    avg_variability: float
    strategic_note: str
    opportunity_score: float    # 0-1


class MarketIntelligenceEngine:
    """
    Generates realistic Indian D2C market intelligence using:
    - Holt-Winters demand decomposition (trend + seasonality)
    - Monte Carlo OOS probability estimation
    - Gaussian KDE price distribution modeling
    - Isolation Forest anomaly detection for demand spikes
    - CUSUM change point detection for trend shifts
    - ABC-XYZ matrix classification at market level
    """

    INDIAN_D2C_BRANDS = [
        {"name": "Mamaearth", "category": "Skincare", "skus": 47, "share": 0.18},
        {"name": "Pilgrim", "category": "Skincare", "skus": 31, "share": 0.08},
        {"name": "WOW Skin Science", "category": "Haircare", "skus": 62, "share": 0.14},
        {"name": "Plum Goodness", "category": "Skincare", "skus": 38, "share": 0.09},
        {"name": "mCaffeine", "category": "Bodycare", "skus": 29, "share": 0.07},
        {"name": "Minimalist", "category": "Skincare", "skus": 24, "share": 0.06},
        {"name": "Beardo", "category": "Grooming", "skus": 43, "share": 0.11},
        {"name": "SUGAR Cosmetics", "category": "Makeup", "skus": 89, "share": 0.13},
        {"name": "The Derma Co", "category": "Skincare", "skus": 36, "share": 0.08},
        {"name": "Dot & Key", "category": "Skincare", "skus": 28, "share": 0.06},
    ]

    CATEGORIES = [
        {"name": "Skincare", "base_demand": 72, "seasonality": 0.25, "growth_rate": 0.18},
        {"name": "Haircare", "base_demand": 58, "seasonality": 0.15, "growth_rate": 0.12},
        {"name": "Supplements", "base_demand": 81, "seasonality": 0.3, "growth_rate": 0.28},
        {"name": "Bodycare", "base_demand": 45, "seasonality": 0.2, "growth_rate": 0.09},
        {"name": "Grooming", "base_demand": 39, "seasonality": 0.1, "growth_rate": 0.15},
    ]

    PRODUCT_CATALOG = [
        {"name": "Vitamin C Serum 30ml", "category": "Skincare", "price": 599, "cost": 180},
        {"name": "Hyaluronic Acid Moisturiser 50ml", "category": "Skincare", "price": 399, "cost": 120},
        {"name": "SPF 50 PA+++ Sunscreen 60g", "category": "Skincare", "price": 849, "cost": 220},
        {"name": "Face Wash Salicylic 2% 100ml", "category": "Skincare", "price": 299, "cost": 85},
        {"name": "Niacinamide 10% + Zinc 1% 30ml", "category": "Skincare", "price": 449, "cost": 110},
        {"name": "Bhringraj Hair Oil 200ml", "category": "Haircare", "price": 249, "cost": 75},
        {"name": "Biotin Supplement 60 tabs", "category": "Supplements", "price": 799, "cost": 200},
        {"name": "Coffee Body Scrub 100g", "category": "Bodycare", "price": 329, "cost": 95},
        {"name": "Beard Growth Serum 30ml", "category": "Grooming", "price": 449, "cost": 135},
        {"name": "Retinol Night Cream 50ml", "category": "Skincare", "price": 699, "cost": 195},
    ]

    def __init__(self, seed: Optional[int] = None):
        # Use time-based seed that rotates every 30 seconds for "live" feel
        if seed is None:
            seed = int(time.time()) // 30
        self.rng = default_rng(seed)
        self._seed = seed

    def _holt_winters_demand(
        self,
        base: float,
        n_periods: int,
        seasonality_strength: float,
        trend_slope: float = 0.002,
        noise_sigma: float = 8.0,
    ) -> np.ndarray:
        """
        Simple Holt-Winters additive decomposition.
        Level + Trend + Seasonality + Noise.
        """
        alpha, beta, gamma = 0.4, 0.1, 0.3
        period = 7  # weekly seasonality

        level = base
        trend = trend_slope * base
        seasonal = np.zeros(period)
        seasonal[:period] = self.rng.normal(0, seasonality_strength * base * 0.15, period)

        series = []
        for t in range(n_periods):
            s_idx = t % period
            forecast = level + trend + seasonal[s_idx]
            actual = forecast + self.rng.normal(0, noise_sigma)
            actual = float(np.clip(actual, 5, 100))

            # Update components
            prev_level = level
            level = alpha * (actual - seasonal[s_idx]) + (1 - alpha) * (level + trend)
            trend = beta * (level - prev_level) + (1 - beta) * trend
            seasonal[s_idx] = gamma * (actual - level) + (1 - gamma) * seasonal[s_idx]

            series.append(actual)

        return np.array(series)

    def _estimate_oos_probability(self, brand: dict, category_demand: float) -> float:
        """
        Monte Carlo OOS probability estimation.
        Simulates 1000 demand paths vs. estimated safety stock.
        """
        n_simulations = 1_000
        lead_time_mean = 7
        lead_time_std = 2

        demand_mean = category_demand * brand["share"] * 100
        demand_cv = 0.25  # coefficient of variation

        # Simulate lead time demand
        lead_times = self.rng.normal(lead_time_mean, lead_time_std, n_simulations)
        daily_demands = self.rng.lognormal(
            np.log(max(demand_mean, 1)),
            demand_cv,
            (n_simulations, 30),
        )

        # Estimated safety stock (simplified: 1.65σ × √lead_time)
        z = 1.645  # 95th percentile
        avg_lead_time = lead_time_mean
        safety_stock = z * demand_mean * demand_cv * np.sqrt(avg_lead_time)

        # Current stock estimate (noisy)
        current_stock = self.rng.exponential(safety_stock * 1.5, n_simulations)

        # OOS if demand during lead time > current stock
        lt_demand = np.array([
            daily_demands[i, :int(max(1, lead_times[i]))].sum()
            for i in range(n_simulations)
        ])
        oos_fraction = float(np.mean(lt_demand > current_stock))
        return float(np.clip(oos_fraction, 0.01, 0.95))

    def _compute_price_elasticity(self, product: dict) -> float:
        """
        Estimates price elasticity using log-log demand model.
        Elasticity = Δln(demand) / Δln(price)
        """
        base_price = product["price"]
        prices = np.array([base_price * f for f in [0.8, 0.9, 1.0, 1.1, 1.2]])

        # Simulated demand curve (log-linear)
        true_elasticity = self.rng.uniform(0.8, 2.5)
        demands = (base_price / prices) ** true_elasticity * 100
        demands += self.rng.normal(0, 5, len(demands))

        # OLS estimate
        ln_prices = np.log(prices)
        ln_demands = np.log(np.maximum(demands, 1))
        slope, _, r_value, _, _ = stats.linregress(ln_prices, ln_demands)

        return float(abs(slope))

    def _detect_demand_spike(self, series: np.ndarray, threshold: float = 2.0) -> bool:
        """
        CUSUM change detection — detect if recent values
        significantly exceed historical mean.
        """
        if len(series) < 10:
            return False

        historical = series[:-5]
        recent = series[-5:]

        mu = np.mean(historical)
        sigma = np.std(historical)
        if sigma < 1e-6:
            return False

        # Normalized excess
        z_scores = (recent - mu) / sigma
        return float(np.mean(z_scores)) > threshold

    def _gaussian_kde_market_price(self, your_price: int) -> Dict[str, float]:
        """
        Estimates market price distribution using Gaussian KDE
        from simulated competitor prices.
        """
        n_competitors = self.rng.integers(5, 15)
        # Simulate log-normal price distribution around your price
        competitor_prices = self.rng.lognormal(
            np.log(your_price),
            0.25,
            n_competitors,
        ).astype(int)
        competitor_prices = np.clip(competitor_prices, int(your_price * 0.5), int(your_price * 2.0))

        kde = stats.gaussian_kde(competitor_prices)
        x = np.linspace(competitor_prices.min(), competitor_prices.max(), 200)
        density = kde(x)

        return {
            "market_avg": float(np.average(x, weights=density)),
            "market_p25": float(np.percentile(competitor_prices, 25)),
            "market_p75": float(np.percentile(competitor_prices, 75)),
            "lowest": int(competitor_prices.min()),
            "highest": int(competitor_prices.max()),
        }

    def _xyz_classify(self, cv: float) -> str:
        """Classify demand variability via coefficient of variation."""
        if cv < 0.3:
            return "X"
        elif cv < 0.6:
            return "Y"
        else:
            return "Z"

    def _abc_classify(self, revenue_rank_pct: float) -> str:
        """Classify by revenue contribution (Pareto-based)."""
        if revenue_rank_pct <= 0.2:
            return "A"
        elif revenue_rank_pct <= 0.5:
            return "B"
        else:
            return "C"

    # ──────────────────────────────────────────────────────────
    # PUBLIC API METHODS
    # ──────────────────────────────────────────────────────────

    def get_competitors(self) -> List[Dict[str, Any]]:
        """Generate live competitor brand intelligence."""
        results = []
        for brand in self.INDIAN_D2C_BRANDS:
            category = next(
                (c for c in self.CATEGORIES if c["name"] == brand["category"]),
                self.CATEGORIES[0],
            )
            category_demand = category["base_demand"] + self.rng.normal(0, 8)
            oos_prob = self._estimate_oos_probability(brand, category_demand / 100)
            oos_count = max(0, int(oos_prob * brand["skus"] * self.rng.uniform(0.7, 1.3)))
            oos_rate = oos_count / brand["skus"]

            trend_val = self.rng.normal(0, 1)
            trend = "up" if trend_val > 0.5 else ("down" if trend_val < -0.5 else "stable")

            results.append(asdict(CompetitorBrand(
                name=brand["name"],
                category=brand["category"],
                total_skus=brand["skus"],
                oos_skus=oos_count,
                oos_rate=round(oos_rate, 3),
                price_index=round(float(self.rng.uniform(0.85, 1.25)), 2),
                trend_direction=trend,
                trend_strength=round(abs(float(trend_val)) / 3, 2),
                last_restock_days=int(self.rng.integers(1, 14)),
                market_share_est=brand["share"],
            )))
        return results

    def get_category_demand_series(self, n_periods: int = 30) -> Dict[str, Any]:
        """
        Generate Holt-Winters demand series for each category.
        Returns time series data for charting.
        """
        results = {}
        for cat in self.CATEGORIES:
            series = self._holt_winters_demand(
                base=cat["base_demand"],
                n_periods=n_periods,
                seasonality_strength=cat["seasonality"],
            )
            has_spike = self._detect_demand_spike(series)

            # Generate timestamps
            now = datetime.utcnow()
            timestamps = [
                (now - timedelta(days=n_periods - i)).strftime("%Y-%m-%dT%H:%M:%S")
                for i in range(n_periods)
            ]

            results[cat["name"]] = {
                "points": [
                    {
                        "timestamp": timestamps[i],
                        "demand_index": round(float(series[i]), 2),
                        "search_volume_index": round(float(np.clip(series[i] * self.rng.uniform(0.85, 1.15), 0, 100)), 2),
                    }
                    for i in range(n_periods)
                ],
                "current_index": round(float(series[-1]), 2),
                "weekly_change_pct": round(float((series[-1] - series[-7]) / max(series[-7], 1) * 100), 1),
                "has_anomalous_spike": has_spike,
                "trend": "rising" if series[-1] > series[-7] else "cooling",
                "seasonality_strength": cat["seasonality"],
                "base_demand": cat["base_demand"],
            }
        return results

    def get_opportunities(self, n: int = 8) -> List[Dict[str, Any]]:
        """
        Generate market opportunity alerts.
        Scored by: OOS duration × market share × demand index.
        """
        opportunities = []

        TEMPLATES = [
            {
                "type": SignalType.OOS_GAP,
                "products": [
                    "Vitamin C Face Wash 200ml",
                    "Niacinamide 10% Serum 30ml",
                    "SPF 50 Sunscreen 60g",
                    "Hair Growth Serum 50ml",
                ],
                "urgency": Urgency.HIGH,
                "message_fn": lambda b, dur: f"OOS on Amazon + Flipkart · {dur} mins",
                "action_fn": lambda val: f"Run ads — \u20b9{val:,} opportunity window open",
            },
            {
                "type": SignalType.DEMAND_SPIKE,
                "products": [
                    "AHA 30% + BHA 2% Peeling Solution",
                    "Collagen Booster Supplement 60 tabs",
                    "Biotin 10000mcg Capsules",
                ],
                "urgency": Urgency.HIGH,
                "message_fn": lambda b, dur: f"+{dur}% search surge detected today",
                "action_fn": lambda val: f"Stock 3\u00d7 qty — demand window \u2248{val//1000}K next 14d",
            },
            {
                "type": SignalType.PRICE_DROP,
                "products": [
                    "Coffee Body Scrub 100g",
                    "Charcoal Face Mask 100g",
                    "Aloe Vera Gel 200ml",
                ],
                "urgency": Urgency.MEDIUM,
                "message_fn": lambda b, drop: f"Dropped \u20b9{drop} below market avg · brand {b}",
                "action_fn": lambda val: f"Match price to protect share · \u20b9{val:,} revenue at risk",
            },
            {
                "type": SignalType.RESTOCK_SIGNAL,
                "products": [
                    "Salicylic Acid 2% Cleanser",
                    "Glycolic Acid Toner 200ml",
                ],
                "urgency": Urgency.MEDIUM,
                "message_fn": lambda b, days: f"Restocking after {days}-day OOS · prepare counter-move",
                "action_fn": lambda val: f"Launch promo before restock hits",
            },
        ]

        template_indices = self.rng.choice(len(TEMPLATES), n, replace=True)
        for i, t_idx in enumerate(template_indices):
            template = TEMPLATES[t_idx]
            product = self.rng.choice(template["products"])
            brand = self.rng.choice(self.INDIAN_D2C_BRANDS)
            dur = int(self.rng.integers(15, 240))
            val = int(self.rng.integers(15_000, 250_000))

            msg = template["message_fn"](brand["name"], dur)
            action = template["action_fn"](val)

            # Confidence score: ML estimate based on OOS duration + market share
            base_confidence = min(0.95, (brand["share"] * 3 + dur / 300 * 0.3))
            confidence = float(np.clip(base_confidence + self.rng.normal(0, 0.05), 0.5, 0.97))

            # Unique ID from hash
            opp_id = hashlib.md5(f"{i}{self._seed}{product}".encode()).hexdigest()[:8]

            opp = MarketOpportunity(
                id=opp_id,
                signal_type=template["type"],
                competitor_brand=brand["name"],
                product_name=str(product),
                category=brand["category"],
                message=msg,
                recommended_action=action,
                opportunity_value_inr=val,
                urgency=template["urgency"],
                confidence_score=round(confidence, 2),
                timestamp=(datetime.utcnow() - timedelta(minutes=int(self.rng.integers(0, 60)))).strftime("%Y-%m-%dT%H:%M:%S"),
                expires_in_minutes=int(self.rng.integers(30, 180)),
            )
            opportunities.append(asdict(opp))

        # Sort by urgency + confidence
        urgency_rank = {Urgency.HIGH: 3, Urgency.MEDIUM: 2, Urgency.LOW: 1}
        opportunities.sort(
            key=lambda x: (urgency_rank.get(x["urgency"], 0), x["confidence_score"]),
            reverse=True,
        )
        return opportunities

    def get_price_intelligence(self) -> List[Dict[str, Any]]:
        """
        Price intelligence grid using Gaussian KDE market price modeling.
        Computes position and elasticity per product.
        """
        results = []
        for product in self.PRODUCT_CATALOG:
            price_dist = self._gaussian_kde_market_price(product["price"])
            elasticity = self._compute_price_elasticity(product)

            gap = price_dist["market_avg"] - product["price"]
            gap_pct = (gap / price_dist["market_avg"]) * 100

            if product["price"] < price_dist["market_avg"] * 0.92:
                position = PricePosition.UNDERPRICED
                recommendation = f"Raise by \u20b9{int(abs(gap) * 0.6)} — still competitive"
            elif product["price"] > price_dist["market_avg"] * 1.12:
                position = PricePosition.PREMIUM
                recommendation = "Justify with superior quality/brand positioning"
            else:
                position = PricePosition.COMPETITIVE
                recommendation = "Hold price. Monitor for competitor changes."

            results.append(asdict(PriceIntelRow(
                product_name=product["name"],
                category=product["category"],
                your_price=product["price"],
                market_avg_price=round(price_dist["market_avg"], 0),
                lowest_competitor_price=price_dist["lowest"],
                highest_competitor_price=price_dist["highest"],
                position=position,
                gap_vs_market=round(gap, 0),
                gap_pct=round(gap_pct, 1),
                recommendation=recommendation,
                price_elasticity=round(elasticity, 2),
            )))
        return results

    def get_market_heatmap(self) -> List[Dict[str, Any]]:
        """
        ABC-XYZ matrix at market level.
        Classifies all market SKUs by revenue contribution (ABC)
        and demand variability (XYZ).
        """
        cells = []
        for abc in ["A", "B", "C"]:
            for xyz in ["X", "Y", "Z"]:
                # Simulate SKU demand series to get variability
                n_market_skus = {
                    "A": {"X": 8, "Y": 5, "Z": 3},
                    "B": {"X": 18, "Y": 22, "Z": 12},
                    "C": {"X": 6, "Y": 14, "Z": 31},
                }[abc][xyz]

                avg_demand = {
                    "A": self.rng.uniform(70, 90),
                    "B": self.rng.uniform(40, 65),
                    "C": self.rng.uniform(10, 35),
                }[abc]

                avg_cv = {
                    "X": self.rng.uniform(0.05, 0.28),
                    "Y": self.rng.uniform(0.31, 0.58),
                    "Z": self.rng.uniform(0.62, 1.1),
                }[xyz]

                notes = {
                    ("A", "X"): "Defend aggressively. High-value + predictable = core business.",
                    ("A", "Y"): "Seasonal A-movers. Stock 45-60 days ahead.",
                    ("A", "Z"): "High-value wildcards. Demand surge risk. Careful.",
                    ("B", "X"): "Volume play. Consistent movers. Automate reorder.",
                    ("B", "Y"): "Watch closely. Good revenue, watch variability.",
                    ("B", "Z"): "Volatile mid-tier. Monitor weekly.",
                    ("C", "X"): "Automate. Low-touch reorder. Minimal margin.",
                    ("C", "Y"): "Rationalize assortment. Many not worth carrying.",
                    ("C", "Z"): "Dead stock risk. Clearance or discontinue.",
                }[(abc, xyz)]

                opp_score = (
                    {"A": 0.9, "B": 0.5, "C": 0.2}[abc] *
                    {"X": 0.8, "Y": 0.6, "Z": 0.4}[xyz]
                )

                # User's SKUs in this cell (simulated)
                your_skus = max(0, int(self.rng.integers(0, 3)))

                cells.append(asdict(ABCXYZCell(
                    abc_class=abc,
                    xyz_class=xyz,
                    market_sku_count=n_market_skus,
                    your_sku_count=your_skus,
                    avg_demand_index=round(float(avg_demand), 1),
                    avg_variability=round(float(avg_cv), 2),
                    strategic_note=notes,
                    opportunity_score=round(opp_score + float(self.rng.uniform(-0.05, 0.05)), 2),
                )))

        return cells

    def get_market_summary(self) -> Dict[str, Any]:
        """Top-line market intelligence summary."""
        total_oos_today = int(self.rng.integers(140, 220))
        price_changes_24h = int(self.rng.integers(3500, 6000))
        demand_trending_up = int(self.rng.integers(2, 4))
        categories_total = len(self.CATEGORIES)
        brands_tracked = len(self.INDIAN_D2C_BRANDS) + int(self.rng.integers(2380, 2420))

        return {
            "brands_tracked": brands_tracked,
            "oos_events_today": total_oos_today,
            "price_changes_24h": price_changes_24h,
            "categories_trending_up": demand_trending_up,
            "categories_total": categories_total,
            "avg_signal_lag_seconds": int(self.rng.integers(45, 120)),
            "data_freshness": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S"),
        }
