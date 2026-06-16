export const ONBOARDING_QUESTIONS = [
  {
    id: "brand_name",
    question: "What is your brand name?",
    type: "text",
    placeholder: "e.g. Glow Naturals",
  },
  {
    id: "category",
    question: "What category does your brand primarily operate in?",
    type: "select",
    options: [
      "Skincare",
      "Haircare",
      "Food & Nutrition",
      "Electronics",
      "Apparel",
      "Home Care",
      "Baby Products",
      "Other",
    ],
  },
  {
    id: "main_channel",
    question: "Where do you primarily sell?",
    type: "select",
    options: [
      "Amazon India",
      "Flipkart",
      "Own Website (D2C)",
      "Quick Commerce (Blinkit/Zepto)",
      "Offline Retail",
      "Multiple Channels",
    ],
  },
  {
    id: "currency",
    question: "What currency do you operate in?",
    type: "select",
    options: ["₹ (INR)", "$ (USD)", "€ (EUR)", "£ (GBP)"],
    default: "₹ (INR)",
  },
  {
    id: "avg_lead_time_days",
    question:
      "How many days does it take from placing a restock order to receiving the goods?",
    type: "number",
    placeholder: "e.g. 7",
    hint: "Include manufacturing + shipping time",
  },
  {
    id: "safety_stock_days",
    question:
      "How many extra days of stock do you like to keep as a buffer (safety stock)?",
    type: "number",
    placeholder: "e.g. 14",
    hint: "Extra cushion in case of delays",
  },
  {
    id: "dead_stock_threshold_days",
    question:
      'After how many days do you consider unsold stock to be "dead" or problematic?',
    type: "number",
    placeholder: "e.g. 90",
    hint: "Industry average is 60-90 days",
  },
  {
    id: "ordering_cost",
    question:
      "What is your approximate cost (₹) for placing one purchase order? (logistics, processing, admin)",
    type: "number",
    placeholder: "e.g. 500",
    hint: "This is used in our reorder quantity calculation",
  },
  {
    id: "holding_cost_pct",
    question:
      "Roughly what % of product cost do you pay per year to store and hold inventory? (warehousing, insurance, opportunity cost)",
    type: "select",
    options: ["Less than 15%", "15-25%", "25-35%", "More than 35%"],
    hint: "FMCG average is 20-30%",
  },
  {
    id: "is_seasonal",
    question: "Does your product demand change significantly by season?",
    type: "select",
    options: [
      "Yes — very seasonal",
      "Somewhat seasonal",
      "Not really",
      "No — flat demand year-round",
    ],
  },
  {
    id: "typical_discount_pct",
    question: "What discount % do you typically run during sales or promotions?",
    type: "number",
    placeholder: "e.g. 20",
    hint: "Used when recommending clearance pricing",
  },
  {
    id: "competitor_brands",
    question:
      "Who are your top 2-3 competitor brands? (helps with opportunity analysis)",
    type: "text",
    placeholder: "e.g. Mamaearth, WOW Skin Science, Plum",
  },
] as const;
