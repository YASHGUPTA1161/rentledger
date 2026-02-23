"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createBill, addPayment } from "./bills-actions";
import { getBillPreviewData } from "./bill-preview-actions";
import { LedgerTable } from "./LedgerTable";
import { BillPreview } from "@/components/BillPreview";
import type { BillData } from "@/lib/generate-bill-data";

interface BillsLedgerProps {
  propertyId: string;
  tenancyId: string;
  bills: any[]; // Replace with proper type
}

export function BillsLedger({
  propertyId,
  tenancyId,
  bills,
}: BillsLedgerProps) {
  const [previewBillId, setPreviewBillId] = useState<string | null>(null);
  const [previewBillData, setPreviewBillData] = useState<BillData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreviewBill = async (billId: string) => {
    setIsLoadingPreview(true);
    setPreviewBillId(billId);

    const result = await getBillPreviewData(billId);

    if (result.success && result.data) {
      setPreviewBillData(result.data);
    } else {
      console.error("Failed to load bill preview:", result.error);
      toast.error("Could not load bill preview", { position: "bottom-right" });
      setPreviewBillId(null);
    }

    setIsLoadingPreview(false);
  };

  const handleClosePreview = () => {
    setPreviewBillId(null);
    setPreviewBillData(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bills & Ledger</h2>

      {/* BILLS LIST */}
      <div className="space-y-4">
        {bills.length === 0 ? (
          /* EMPTY STATE - No bills yet */
          <div className="border rounded-lg p-8 bg-white shadow-sm text-center">
            <div className="mb-6">
              <p className="text-gray-600 text-lg mb-2">
                No bills yet for this tenancy
              </p>
              <p className="text-gray-500 text-sm">
                Add your first entry below to automatically create a bill for
                this month
              </p>
            </div>

            {/* Show ledger table even with no bills - it will auto-create */}
            <LedgerTable
              tenancyId={tenancyId}
              billId="" // Empty for now, will auto-create on first entry
              entries={[]}
              isLandlord={true}
            />
          </div>
        ) : (
          /* EXISTING BILLS */
          bills.map((bill) => (
            <div
              key={bill.id}
              className="border rounded-lg p-6 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {new Date(bill.month).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    bill.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : bill.status === "partial"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {bill.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Rent</p>
                  <p className="font-semibold">₹{bill.rent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Electricity</p>
                  <p className="font-semibold">
                    {bill.electricityUnits ?? 0} units × ₹
                    {bill.electricityRate ?? 0} = ₹
                    {bill.electricityTotal?.toLocaleString() ?? "0"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Water</p>
                  <p className="font-semibold">
                    ₹{bill.waterBill?.toLocaleString() ?? "0"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Carry Forward</p>
                  <p className="font-semibold">
                    {bill.carryForward >= 0 ? "+" : ""}₹
                    {bill.carryForward.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Total</p>
                  <p className="font-bold text-lg">
                    ₹{bill.totalBill.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Paid</p>
                  <p className="font-bold text-lg text-green-600">
                    ₹{bill.paidAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Remaining</p>
                  <p className="font-bold text-lg text-red-600">
                    ₹{bill.remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* PAYMENTS LIST */}
              {bill.payments && bill.payments.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Payments:</h4>
                  {bill.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center py-2"
                    >
                      <div>
                        <span className="font-medium">
                          {new Date(payment.paidAt).toLocaleDateString("en-IN")}
                        </span>
                        {" - "}₹{payment.amount.toLocaleString()} (
                        {payment.paymentMethod})
                        {payment.verifiedByTenant && (
                          <span className="ml-2 text-green-600 text-sm">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      {payment.paymentProof && (
                        <a
                          href={payment.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Screenshot
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* LEDGER TABLE */}
              <div>
                <LedgerTable
                  tenancyId={tenancyId}
                  billId={bill.id}
                  entries={bill.ledgerEntries || []}
                  isLandlord={true}
                />
              </div>

              {/* PREVIEW BILL BUTTON */}
              <button
                onClick={() => handlePreviewBill(bill.id)}
                disabled={isLoadingPreview && previewBillId === bill.id}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoadingPreview && previewBillId === bill.id
                  ? "Loading..."
                  : "📄 Preview Bill"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* BILL PREVIEW MODAL */}
      {previewBillId && previewBillData && (
        <BillPreview
          billId={previewBillId}
          billData={previewBillData}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
