import Papa from "papaparse";

// Expected CSV columns (flexible — user will map them)
export interface ParsedRow {
  date: string;
  product_name: string;
  sku: string;
  units_sold: number;
  price: number;
  current_stock: number;
  stock_on_hand?: number;
  [key: string]: string | number | undefined;
}

export function parseCSV(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data as ParsedRow[]),
      error: (err) => reject(err),
    });
  });
}

// Group flat rows into per-product format
export function groupByProduct(rows: ParsedRow[], columnMap: Record<string, string>) {
  const productMap: Record<string, any> = {};

  for (const row of rows) {
    const name = String(row[columnMap.product_name] || "").trim();
    const sku = String(row[columnMap.sku] || name).trim();
    const date = String(row[columnMap.date] || "").trim();
    const units = Number(row[columnMap.units_sold] || 0);
    const price = Number(row[columnMap.price] || 0);
    const stock = Number(row[columnMap.current_stock] || row[columnMap.stock_on_hand] || 0);

    if (!name || !date) continue;

    if (!productMap[name]) {
      productMap[name] = {
        name,
        sku,
        price: 0,
        current_stock: 0,
        sales_history: [],
        price_readings: [],
        stock_readings: [],
      };
    }

    productMap[name].sales_history.push({ date, units_sold: units });
    if (price > 0) productMap[name].price_readings.push(price);
    if (stock > 0) productMap[name].stock_readings.push(stock);
  }

  // Finalize: use latest price + latest stock
  return Object.values(productMap).map((p: any) => ({
    name: p.name,
    sku: p.sku || p.name,
    price: p.price_readings.length ? p.price_readings[p.price_readings.length - 1] : 0,
    current_stock: p.stock_readings.length ? p.stock_readings[p.stock_readings.length - 1] : 0,
    sales_history: p.sales_history,
  }));
}
