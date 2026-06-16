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
  date: ["date", "sale_date", "order_date", "transaction_date"],
  product_name: ["product_name", "product", "name", "item_name", "title"],
  sku: ["sku", "product_sku", "item_sku", "code"],
  units_sold: ["units_sold", "quantity", "qty", "units", "sales"],
  price: ["price", "unit_price", "selling_price", "mrp"],
  current_stock: ["stock_on_hand", "current_stock", "stock", "inventory", "qty_on_hand"],
};

export function autoDetectColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const field of EXPECTED_FIELDS) {
    const candidates = AUTO_MAP[field.key] || [field.key];
    const match = lowerHeaders.find((h) => candidates.includes(h));
    if (match) {
      const original = headers[lowerHeaders.indexOf(match)];
      map[field.key] = original;
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
