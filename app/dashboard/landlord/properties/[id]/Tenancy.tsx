"use client";

import { useState } from "react";
import { createTenancy, endTenancy } from "./tenancy-actions";

interface TenancyProps {
  propertyId: string;
  activeTenancy?: any; // Replace with proper type later
}

export function Tenancy({ propertyId, activeTenancy }: TenancyProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tenancy</h2>

      {/* SHOW ACTIVE TENANCY IF EXISTS */}
      {activeTenancy ? (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">Active Tenancy</h3>
            <form
              action={async () => {
                await endTenancy(activeTenancy.id, propertyId);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                End Tenancy
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Tenant Name</p>
              <p className="font-semibold">{activeTenancy.tenant.fullName}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Monthly Rent</p>
              <p className="font-semibold">
                ₹{activeTenancy.monthlyRent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Security Deposit</p>
              <p className="font-semibold">
                ₹{activeTenancy.securityDeposit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Lease Period</p>
              <p className="font-semibold">
                {new Date(activeTenancy.leaseStart).toLocaleDateString("en-IN")}
                {" - "}
                {activeTenancy.leaseEnd
                  ? new Date(activeTenancy.leaseEnd).toLocaleDateString("en-IN")
                  : "Ongoing"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* NO ACTIVE TENANCY - SHOW FORM OR BUTTON */
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create New Tenancy
            </button>
          ) : (
            /* CREATE TENANCY FORM */
            <form
              action={createTenancy}
              className="space-y-4 border rounded-lg p-6 bg-white shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-4">Create Tenancy</h3>

              {/* Hidden field - pass propertyId to server */}
              <input type="hidden" name="propertyId" value={propertyId} />

              {/* Tenant Details */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  name="tenantName"
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="tenantEmail"
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="tenantPhone"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    required
                    min="0"
                    step="1"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    required
                    min="0"
                    step="1"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3000"
                  />
                </div>
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lease Start Date *
                  </label>
                  <input
                    type="date"
                    name="leaseStart"
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lease End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="leaseEnd"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Tenancy
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
