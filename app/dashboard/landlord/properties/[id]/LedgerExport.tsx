"use client";

import { useState, useRef, useEffect } from "react";
import type { SerializedLedgerEntry } from "./components/ledger/types";

interface Props {
  entries: SerializedLedgerEntry[];
  fileName?: string;
}

// ── Shared row mapper ─────────────────────────────────────────────────────────
function toRow(e: SerializedLedgerEntry) {
  return {
    Date: new Date(e.entryDate).toLocaleDateString("en-IN"),
    Description: e.description,
    "Meter Reading": e.electricityCurrentReading ?? "",
    "Rate (₹/unit)": e.electricityRate ?? "",
    Units: e.electricityUnitsConsumed ?? "",
    "Electricity (₹)": e.electricityTotal ?? "",
    "Water (₹)": e.waterBill ?? "",
    "Rent (₹)": e.rentAmount ?? "",
    "Debit (₹)": e.debitAmount ?? "",
    "Credit (₹)": e.creditAmount ?? "",
    "Payment Method": e.paymentMethod ?? "",
    Verified: e.verifiedByTenant ? "Yes" : "No",
  };
}

// ── Export handlers ───────────────────────────────────────────────────────────
async function exportExcel(entries: SerializedLedgerEntry[], fileName: string) {
  const XLSX = await import("xlsx");
  const rows = entries.map(toRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] ?? {}).map((k) => ({
    wch: Math.max(k.length + 2, 12),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ledger");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

async function exportPDF(entries: SerializedLedgerEntry[], fileName: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("RentLedger — Ledger Export", 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 21);

  const rows = entries.map(toRow);
  autoTable(doc, {
    head: [Object.keys(rows[0] ?? {})],
    body: rows.map((r) => Object.values(r).map(String)),
    startY: 26,
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 30, 30] },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 38 } },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${fileName}.pdf`);
}

function exportJSON(entries: SerializedLedgerEntry[], fileName: string) {
  // No library needed — native browser API
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Dropdown component ────────────────────────────────────────────────────────
export function LedgerExport({ entries, fileName = "Ledger_Export" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (entries.length === 0) return null;

  const options = [
    {
      label: "📊 Excel (.xlsx)",
      action: () => {
        exportExcel(entries, fileName);
        setOpen(false);
      },
    },
    {
      label: "📄 PDF",
      action: () => {
        exportPDF(entries, fileName);
        setOpen(false);
      },
    },
    {
      label: "{ } JSON",
      action: () => {
        exportJSON(entries, fileName);
        setOpen(false);
      },
    },
  ];

  return (
    <div className="export-wrap" ref={ref}>
      <button
        className="ledger-btn ledger-btn--export"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Export ▾
      </button>

      {open && (
        <ul className="export-dropdown" role="listbox">
          {options.map((opt) => (
            <li key={opt.label}>
              <button className="export-option" onClick={opt.action}>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
