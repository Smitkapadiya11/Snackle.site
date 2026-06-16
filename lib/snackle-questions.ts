export const SNACKLE_QUESTIONS = [
  {
    id: "brand_name",
    text: "Hi! I'm Snackle 1.0. I'm going to ask you 12 quick questions to understand your brand. First — what's your brand name?",
  },
  {
    id: "category",
    text: "Great, {brand_name}! What category does your brand primarily operate in? (Skincare, Haircare, Food & Nutrition, Electronics, Apparel, Home Care, Baby Products, Other)",
  },
  {
    id: "main_channel",
    text: "Where do you primarily sell? Amazon India, Flipkart, your own website, quick commerce (Blinkit/Zepto), offline retail, or multiple channels?",
  },
  {
    id: "currency",
    text: "What currency do you operate in? (₹ INR, $ USD, € EUR, £ GBP)",
  },
  {
    id: "avg_lead_time_days",
    text: "How many days does it usually take from placing a restock order to receiving goods? Include manufacturing + shipping time.",
  },
  {
    id: "safety_stock_days",
    text: "How many extra days of stock do you typically keep as a buffer? This is your safety cushion in case of delays.",
  },
  {
    id: "dead_stock_threshold_days",
    text: "After how many days do you consider unsold inventory 'problematic' or 'dead stock'? Most brands say 60-90 days.",
  },
  {
    id: "ordering_cost",
    text: "Roughly what does it cost you to place one purchase order? Include logistics, paperwork, and your time.",
  },
  {
    id: "holding_cost_pct",
    text: "What percentage of your product cost do you pay annually for storage and holding inventory? (Common range: 15-35%)",
  },
  {
    id: "is_seasonal",
    text: "Does your product demand change significantly by season? (Yes — very seasonal / Somewhat seasonal / Not really / No — flat demand)",
  },
  {
    id: "typical_discount_pct",
    text: "What percentage discount do you typically run during sales or promotions?",
  },
  {
    id: "competitor_brands",
    text: "Who are your top 2-3 competitor brands? This helps me analyze opportunity windows.",
  },
  {
    id: "confirmation",
    text: "Perfect. I have everything I need. Ready to run the full analysis on your {product_count} products? This will take 20 seconds to 5 minutes. Type 'yes' or hit send to begin.",
  },
] as const;

export const PROCESSING_MESSAGES = [
  "Initializing analysis engine...",
  "Running Monte Carlo simulation (10,000 paths)...",
  "Forecasting demand with Holt-Winters...",
  "Calculating safety stock & EOQ...",
  "Classifying ABC-XYZ matrix...",
  "Detecting anomalies with Isolation Forest...",
  "Running CUSUM change detection...",
  "Optimizing markdown pricing...",
  "Computing GMROI analysis...",
  "Snackle 1.0 generating AI summaries...",
];

export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
];

export function interpolateQuestion(text: string, answers: Record<string, string>, productCount: number) {
  return text
    .replace("{brand_name}", answers.brand_name || "there")
    .replace("{product_count}", String(productCount));
}

export function normalizeCurrencyInput(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("usd") || lower.includes("$")) return "$ (USD)";
  if (lower.includes("eur") || lower.includes("€")) return "€ (EUR)";
  if (lower.includes("gbp") || lower.includes("£")) return "£ (GBP)";
  return "₹ (INR)";
}

export function normalizeHoldingCost(input: string): string {
  const n = parseInt(input, 10);
  if (Number.isNaN(n)) {
    if (input.includes("Less")) return "Less than 15%";
    if (input.includes("35") || input.includes("More")) return "More than 35%";
    if (input.includes("25")) return "25-35%";
    return "15-25%";
  }
  if (n < 15) return "Less than 15%";
  if (n <= 25) return "15-25%";
  if (n <= 35) return "25-35%";
  return "More than 35%";
}
