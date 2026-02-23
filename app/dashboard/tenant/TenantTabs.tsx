"use client";

import { useState } from "react";
import { TenantBills } from "./TenantBills";
import { TenantDocuments } from "./TenantDocuments";
import { TenantMaintenance } from "./TenantMaintenance";
import { ActivityLog } from "@/app/dashboard/landlord/properties/[id]/ActivityLog";
import { TENANT_TABS, type TenantTabId } from "./components/constants";

// ─── Types ────────────────────────────────────────────────────
interface TenantTabsProps {
  propertyId: string;
  tenancyId: string;
  tenancy: Record<string, unknown>;
  bills: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  maintenanceRequests: Record<string, unknown>[];
  activityLogs: Record<string, unknown>[];
}

// ─── TenantTabs ───────────────────────────────────────────────
// Sidebar nav + tab content switcher for the tenant dashboard.
// Tab labels & order → edit in ./components/constants.ts TENANT_TABS
// ─────────────────────────────────────────────────────────────

export function TenantTabs({
  propertyId,
  tenancyId,
  tenancy,
  bills,
  documents,
  maintenanceRequests,
  activityLogs,
}: TenantTabsProps) {
  const [activeTab, setActiveTab] = useState<TenantTabId>(TENANT_TABS[0].id);

  return (
    <div className="tenant-tabs-layout">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="tenant-tabs-sidebar">
        {/* Active tenancy summary card */}
        <div className="tenant-active-card">
          <p className="tenant-active-label">ACTIVE TENANCY</p>
          <p className="tenant-active-rent">
            Rent: ₹{(tenancy.monthlyRent as number).toLocaleString()}/mo
          </p>
        </div>

        {/* Tab nav buttons — labels from TENANT_TABS constant */}
        {TENANT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tenant-tab-btn ${activeTab === tab.id ? "tenant-tab-btn--active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      {/* ── Content ─────────────────────────────────── */}
      <main className="tenant-tabs-content">
        {activeTab === "bills" && (
          <TenantBills
            propertyId={propertyId}
            tenancyId={tenancyId}
            bills={bills}
          />
        )}
        {activeTab === "documents" && (
          <TenantDocuments propertyId={propertyId} documents={documents} />
        )}
        {activeTab === "maintenance" && (
          <TenantMaintenance
            propertyId={propertyId}
            maintenanceRequests={maintenanceRequests as never[]}
          />
        )}
        {activeTab === "activity" && (
          <ActivityLog
            propertyId={propertyId}
            activityLogs={activityLogs as never[]}
          />
        )}
      </main>
    </div>
  );
}
