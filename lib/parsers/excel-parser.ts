import * as XLSX from "xlsx";
import { ParsedRow } from "./csv-parser";

export async function parseExcel(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { raw: false }) as ParsedRow[];
}
