"use client";

import { ParsedRow } from "@/lib/parsers/csv-parser";

export const EXPECTED_FIELDS = [
  { key: "date", label: "Date", required: true },
  { key: "product_name", label: "Product Name", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "units_sold", label: "Units Sold", required: true },
  { key: "price", label: "Price", required: false },
  { key: "current_stock", label: "Stock on Hand", required: false },
] as const;

const AUTO_MAP: Record<string, string[]> = {
  date: [
    "date", "sale_date", "order_date", "transaction_date", "invoice_date",
    "bill_date", "dispatch_date", "created_date", "date_of_sale", "orderdate",
    "saledate", "dt", "salesdate", "doc_date", "booking_date",
  ],
  product_name: [
    "product_name", "product", "name", "item_name", "title", "item",
    "product_desc", "description", "item_description", "productname",
    "prod_name", "goods_name", "article_name", "article", "item_desc",
    "particular", "particulars", "narration",
  ],
  sku: [
    "sku", "product_sku", "item_sku", "code", "product_code", "item_code",
    "asin", "fnsku", "barcode", "ean", "isbn", "model_no", "model",
    "sku_code", "product_id", "item_id", "prod_code",
  ],
  units_sold: [
    "units_sold", "quantity", "qty", "units", "sales", "sold",
    "qty_sold", "quantity_sold", "sale_qty", "sales_qty",
    "units_ordered", "order_qty", "qty_ordered", "invoiced_qty",
    "billed_qty", "dispatched_qty", "shipped_qty", "pieces",
    "pcs", "nos", "number_of_units", "no_of_units",
  ],
  price: [
    "price", "unit_price", "selling_price", "mrp", "rate", "sp",
    "sale_price", "retail_price", "list_price", "basic_price",
    "net_price", "gross_price", "invoice_price", "billing_price",
    "amount_per_unit", "per_unit_price", "item_price", "cost_price",
    "landed_cost", "dp", "dealer_price",
  ],
  current_stock: [
    "stock_on_hand", "current_stock", "stock", "inventory",
    "qty_on_hand", "closing_stock", "balance_qty", "balance",
    "available_qty", "available_stock", "in_hand", "on_hand",
    "inventory_qty", "stock_qty", "remaining_stock", "unsold_qty",
    "opening_stock", "stock_balance",
  ],
};

export function autoDetectColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  // Normalize: lowercase + strip spaces/underscores/hyphens for fuzzy matching
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-\.]+/g, "");
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const normalHeaders = headers.map((h) => normalize(h));

  for (const field of EXPECTED_FIELDS) {
    if (map[field.key]) continue; // already matched
    const candidates = AUTO_MAP[field.key] || [field.key];

    // Pass 1: exact lowercase match
    let matchIdx = lowerHeaders.findIndex((h) => candidates.includes(h));

    // Pass 2: normalized match (strip spaces/underscores)
    if (matchIdx === -1) {
      const normalCandidates = candidates.map(normalize);
      matchIdx = normalHeaders.findIndex((h) => normalCandidates.includes(h));
    }

    // Pass 3: substring match (e.g. "Selling Price" contains "price")
    if (matchIdx === -1) {
      matchIdx = lowerHeaders.findIndex((h) =>
        candidates.some((c) => h.includes(c) || c.includes(h))
      );
    }

    if (matchIdx !== -1) {
      map[field.key] = headers[matchIdx];
    }
  }
  return map;
}

interface Props {
  headers: string[];
  columnMap: Record<string, string>;
  onChange: (map: Record<string, string>) => void;
  previewRows: ParsedRow[];
}

export default function ColumnMapper({ headers, columnMap, onChange, previewRows }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {EXPECTED_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400"> *</span>}
            </label>
            <select
              value={columnMap[field.key] || ""}
              onChange={(e) => onChange({ ...columnMap, [field.key]: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
            >
              <option value="">— Select column —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {previewRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <p className="border-b border-gray-700 bg-[#252525] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Preview (first 5 rows)
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                {headers.slice(0, 6).map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-b border-gray-800 text-gray-300">
                  {headers.slice(0, 6).map((h) => (
                    <td key={h} className="px-4 py-2">
                      {String(row[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
