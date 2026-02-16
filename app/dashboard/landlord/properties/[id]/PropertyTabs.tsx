"use client";

import { useState } from "react";
import { Overview } from "./Overview";
import { Tenancy } from "./Tenancy";
import { BillsLedger } from "./BillsLedger";
import { Documents } from "./Documents";
import { Maintenance } from "./Maintenance";
import { ActivityLog } from "./ActivityLog";

export function PropertyTabs({
  propertyId,
  activeTenancy,
  bills, // ← ADD THIS
}: {
  propertyId: string;
  activeTenancy: any;
  bills: any[]; // ← ADD THIS
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "tenancy", label: "Tenancy", icon: "👤" },
    { id: "bills", label: "Bills & Ledger", icon: "💰" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "maintenance", label: "Maintenance", icon: "🔧" },
    { id: "activity", label: "Activity Log", icon: "📝" },
  ];

  return (
    <div className="flex gap-6" style={{ marginTop: "2rem" }}>
      {/* Sidebar */}
      <div className="w-64 border-r pr-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded mb-2 flex items-center gap-3 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "overview" && <Overview propertyId={propertyId} />}
        {activeTab === "tenancy" && (
          <Tenancy propertyId={propertyId} activeTenancy={activeTenancy} />
        )}
        {activeTab === "bills" && (
          <BillsLedger
            propertyId={propertyId}
            tenancyId={activeTenancy?.id}
            bills={bills}
          />
        )}
        {activeTab === "documents" && <Documents propertyId={propertyId} />}
        {activeTab === "maintenance" && <Maintenance propertyId={propertyId} />}
        {activeTab === "activity" && <ActivityLog propertyId={propertyId} />}
      </div>
    </div>
  );
}
