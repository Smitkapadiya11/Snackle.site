import json
import urllib.request

health = urllib.request.urlopen("http://localhost:8000/health").read()
print("health:", health.decode())

payload = {
    "products": [{
        "name": "Face Serum Premium",
        "sku": "FSP001",
        "price": 899,
        "current_stock": 208,
        "sales_history": [
            {"date": f"2024-03-0{i}", "units_sold": u}
            for i, u in zip([1, 2, 3, 4, 5, 6, 7], [22, 25, 20, 23, 21, 24, 22])
        ],
    }],
    "brand_context": {
        "brand_name": "Glow Naturals",
        "currency": "INR",
        "category": "Skincare",
        "avg_lead_time_days": 7,
        "safety_stock_days": 14,
        "ordering_cost": 500,
        "holding_cost_pct": 0.25,
        "dead_stock_threshold_days": 90,
        "typical_discount_pct": 20,
        "main_channel": "D2C",
    },
}

req = urllib.request.Request(
    "http://localhost:8000/analyze",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
resp = urllib.request.urlopen(req, timeout=120)
data = json.loads(resp.read())
p = data["data"]["products"][0]
print("engine_version:", data["data"]["engine_version"])
print("status:", p["status"])
print("risk_score:", p["risk_score"]["overall_risk_score"])
print("monte_carlo_sims:", p["monte_carlo"]["simulations_run"])
print("abc_xyz:", p["abc_xyz"]["abc_xyz_cell"])
print("forecast_model:", p["forecast"]["forecast_model_used"])
print("processing_ms:", data["processing_time_ms"])
