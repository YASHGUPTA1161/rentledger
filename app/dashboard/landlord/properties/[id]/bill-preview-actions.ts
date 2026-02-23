"use server";

import { generateBillData } from "@/lib/generate-bill-data";

export async function getBillPreviewData(billId: string) {
  try {
    const billData = await generateBillData(billId);
    return { success: true, data: billData };
  } catch (error) {
    console.error("Failed to generate bill data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load bill data",
    };
  }
}
