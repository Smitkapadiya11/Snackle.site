"use client";

import { useMemo, useState } from "react";
import { AnalysisResult } from "@/lib/types";
import { PythonProductAnalysis } from "@/lib/python-types";

interface ABCXYZMatrixProps {
  result: AnalysisResult;
  currency: string;
}

interface MatrixCellData {
  cell: string;
  abc: "A" | "B" | "C";
  xyz: "X" | "Y" | "Z";
  products: PythonProductAnalysis[];
  strategy: string;
  badge: string;
  color: string;
}

const STRATEGIES: Record<string, { badge: string; strategy: string; color: string }> = {
  AX: {
    badge: "Tight Control",
    strategy: "High value, stable demand. Maintain low safety stock, review weekly, use automated replenishment.",
    color: "#22c55e",
  },
  AY: {
    badge: "Active Management",
    strategy: "High value, variable demand. Maintain medium safety stock, review weekly, forecast carefully.",
    color: "#eab308",
  },
  AZ: {
    badge: "High Risk",
    strategy: "High value, erratic demand. Keep safety stock high, review daily, order on-demand or use JIT.",
    color: "#ef4444",
  },
  BX: {
    badge: "Standard Control",
    strategy: "Medium value, stable demand. Review bi-weekly, automate ordering with standard EOQ.",
    color: "#3b82f6",
  },
  BY: {
    badge: "Standard Dynamic",
    strategy: "Medium value, variable demand. Review bi-weekly, adjust reorder points based on seasonal factors.",
    color: "#a855f7",
  },
  BZ: {
    badge: "High Buffer",
    strategy: "Medium value, erratic demand. Maintain larger safety stock buffer, review weekly, run promotional clearance for excess.",
    color: "#f97316",
  },
  CX: {
    badge: "Automated Bulk",
    strategy: "Low value, stable demand. Low review frequency (monthly), automate with large reorder quantities (bulk).",
    color: "#6b7280",
  },
  CY: {
    badge: "Periodic Review",
    strategy: "Low value, variable demand. Review monthly, adjust buffer stock seasonally, bundle with A-class items.",
    color: "#4b5563",
  },
  CZ: {
    badge: "Clearance / JIT",
    strategy: "Low value, erratic demand. Run JIT or order strictly to customer demand, clear obsolete stock aggressively.",
    color: "#374151",
  },
};

export default function ABCXYZMatrix({ result, currency }: ABCXYZMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>("AX");

  const v2Products = useMemo(() => {
    return result.product_cards
      .map((c) => c.engine_v2 as PythonProductAnalysis | undefined)
      .filter((p): p is PythonProductAnalysis => !!p);
  }, [result]);

  const matrixData = useMemo(() => {
    const data: Record<string, PythonProductAnalysis[]> = {
      AX: [], AY: [], AZ: [],
      BX: [], BY: [], BZ: [],
      CX: [], CY: [], CZ: [],
    };

    v2Products.forEach((p) => {
      const cell = p.abc_xyz?.abc_xyz_cell;
      if (cell && data[cell]) {
        data[cell].push(p);
      } else {
        // Fallback calculation if abc_xyz is missing
        const abc = p.price * p.forecast.daily_avg > 5000 ? "A" : p.price * p.forecast.daily_avg > 1000 ? "B" : "C";
        const xyz = p.forecast.model_accuracy_mape < 0.2 ? "X" : p.forecast.model_accuracy_mape < 0.4 ? "Y" : "Z";
        data[`${abc}${xyz}`].push(p);
      }
    });

    const cells: Record<string, MatrixCellData> = {};
    Object.keys(data).forEach((cell) => {
      const abc = cell[0] as "A" | "B" | "C";
      const xyz = cell[1] as "X" | "Y" | "Z";
      const info = STRATEGIES[cell] || { badge: "Standard", strategy: "Standard inventory review.", color: "#6b7280" };
      cells[cell] = {
        cell,
        abc,
        xyz,
        products: data[cell],
        strategy: info.strategy,
        badge: info.badge,
        color: info.color,
      };
    });

    return cells;
  }, [v2Products]);

  const selectedCellData = selectedCell ? matrixData[selectedCell] : null;

  return (
    <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
          ABC-XYZ Inventory Matrix
        </h3>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Classify your portfolio by Revenue Contribution (A/B/C) and Predictability/Variability (X/Y/Z). Click a cell to view products.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
        {/* The 3x3 Matrix grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Header Row: X Y Z */}
          <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 1fr", textAlign: "center", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            <div />
            <div>X <span style={{ fontSize: 9, fontWeight: 400, display: "block" }}>(Stable)</span></div>
            <div>Y <span style={{ fontSize: 9, fontWeight: 400, display: "block" }}>(Variable)</span></div>
            <div>Z <span style={{ fontSize: 9, fontWeight: 400, display: "block" }}>(Erratic)</span></div>
          </div>

          {/* Grid rows A, B, C */}
          {(["A", "B", "C"] as const).map((abc) => (
            <div key={abc} style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
              {/* Row Header Label */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                {abc}
                <span style={{ fontSize: 8, fontWeight: 400, display: "block" }}>
                  {abc === "A" ? "High Val" : abc === "B" ? "Mid Val" : "Low Val"}
                </span>
              </div>

              {/* Grid cells for this row */}
              {(["X", "Y", "Z"] as const).map((xyz) => {
                const cellKey = `${abc}${xyz}`;
                const cell = matrixData[cellKey];
                const isSelected = selectedCell === cellKey;
                const hasProducts = cell.products.length > 0;

                return (
                  <button
                    key={cellKey}
                    onClick={() => setSelectedCell(cellKey)}
                    style={{
                      height: 72,
                      background: isSelected
                        ? `${cell.color}25`
                        : hasProducts
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(255,255,255,0.01)",
                      border: isSelected
                        ? `1.5px solid ${cell.color}`
                        : `1px solid ${hasProducts ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? cell.color : "rgba(255,255,255,0.4)" }}>
                        {cellKey}
                      </span>
                      {hasProducts && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: isSelected ? cell.color : "rgba(252,163,17,0.15)",
                          color: isSelected ? "#000" : "#FCA311",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {cell.products.length}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}>
                      {cell.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected Cell Strategy & Product List */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 16,
          minHeight: 246,
          display: "flex",
          flexDirection: "column",
        }}>
          {selectedCellData ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
              {/* Strategy Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: selectedCellData.color }}>
                  {selectedCellData.cell} Strategy
                </span>
                <span style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: `${selectedCellData.color}15`,
                  color: selectedCellData.color,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${selectedCellData.color}30`,
                }}>
                  {selectedCellData.badge}
                </span>
              </div>

              {/* Strategy text */}
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, marginBottom: 14 }}>
                {selectedCellData.strategy}
              </p>

              {/* Product list */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, flex: 1, overflowY: "auto", maxHeight: 130 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Products in Cell ({selectedCellData.products.length})
                </div>

                {selectedCellData.products.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selectedCellData.products.map((p) => (
                      <div
                        key={p.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12,
                          padding: "6px 8px",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 6,
                        }}
                      >
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
                          <span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>{p.sku}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                          Stock: {Math.round(p.current_stock)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
                    No products in this matrix cell.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Select a cell to view inventory strategy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
