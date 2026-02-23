/**
 * BILL TEMPLATE CONFIGURATION
 *
 * This file defines the structure and styling of rent bills.
 * You can modify this file anytime to change how bills look without touching other code.
 */

export interface BillTemplate {
  header: BillHeader;
  sections: BillSection[];
  footer: BillFooter;
  styling: BillStyling;
}

interface BillHeader {
  title: string;
  showLogo: boolean;
  showReceiptNumber: boolean;
  showDate: boolean;
}

interface BillSection {
  id: string;
  title: string;
  fields: BillField[];
  showDivider: boolean;
}

interface BillField {
  label: string;
  dataKey: string; // Property path like "property.address" or "tenant.name"
  format?: "currency" | "date" | "text" | "phone" | "email";
  showLabel: boolean;
}

interface BillFooter {
  showSignature: boolean;
  showTermsAndConditions: boolean;
  customText?: string;
}

interface BillStyling {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
  };
  fonts: {
    title: string;
    body: string;
    size: {
      title: string;
      heading: string;
      body: string;
      small: string;
    };
  };
  spacing: {
    padding: string;
    gap: string;
  };
}

/**
 * DEFAULT BILL TEMPLATE
 * Modify this to change how your bills look!
 */
export const defaultBillTemplate: BillTemplate = {
  header: {
    title: "Rent Receipt",
    showLogo: false,
    showReceiptNumber: true,
    showDate: true,
  },

  sections: [
    // LANDLORD SECTION
    {
      id: "landlord",
      title: "From (Landlord)",
      showDivider: true,
      fields: [
        {
          label: "Name",
          dataKey: "landlord.name",
          format: "text",
          showLabel: true,
        },
        {
          label: "Property Address",
          dataKey: "property.address",
          format: "text",
          showLabel: true,
        },
      ],
    },

    // TENANT SECTION
    {
      id: "tenant",
      title: "To (Tenant)",
      showDivider: true,
      fields: [
        {
          label: "Name",
          dataKey: "tenant.name",
          format: "text",
          showLabel: true,
        },
        {
          label: "Email",
          dataKey: "tenant.email",
          format: "email",
          showLabel: true,
        },
        {
          label: "Phone",
          dataKey: "tenant.phone",
          format: "phone",
          showLabel: true,
        },
      ],
    },

    // CHARGES BREAKDOWN
    {
      id: "charges",
      title: "Charges Breakdown",
      showDivider: true,
      fields: [
        {
          label: "Rent",
          dataKey: "charges.rent",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Electricity",
          dataKey: "charges.electricity",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Water",
          dataKey: "charges.water",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Maintenance",
          dataKey: "charges.maintenance",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Other",
          dataKey: "charges.other",
          format: "currency",
          showLabel: true,
        },
      ],
    },

    // TOTALS SECTION
    {
      id: "totals",
      title: "Summary",
      showDivider: true,
      fields: [
        {
          label: "Subtotal",
          dataKey: "totals.subtotal",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Previous Balance",
          dataKey: "totals.carryForward",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Total Amount Due",
          dataKey: "totals.total",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Amount Paid",
          dataKey: "totals.paid",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Balance Remaining",
          dataKey: "totals.remaining",
          format: "currency",
          showLabel: true,
        },
      ],
    },
  ],

  footer: {
    showSignature: true,
    showTermsAndConditions: false,
    customText: "Thank you for your payment!",
  },

  styling: {
    colors: {
      primary: "#2563eb", // Blue
      secondary: "#64748b", // Gray
      text: "#1e293b",
      border: "#e2e8f0",
    },
    fonts: {
      title: "Arial, sans-serif",
      body: "Arial, sans-serif",
      size: {
        title: "28px",
        heading: "18px",
        body: "14px",
        small: "12px",
      },
    },
    spacing: {
      padding: "20px",
      gap: "16px",
    },
  },
};

/**
 * ALTERNATIVE TEMPLATE: Minimal Style
 * Uncomment and export this to use a minimal black & white style
 */
export const minimalBillTemplate: BillTemplate = {
  header: {
    title: "Monthly Rent Bill",
    showLogo: false,
    showReceiptNumber: true,
    showDate: true,
  },

  sections: [
    {
      id: "details",
      title: "Bill Details",
      showDivider: false,
      fields: [
        {
          label: "Property",
          dataKey: "property.address",
          format: "text",
          showLabel: true,
        },
        {
          label: "Tenant",
          dataKey: "tenant.name",
          format: "text",
          showLabel: true,
        },
        {
          label: "Period",
          dataKey: "bill.period",
          format: "text",
          showLabel: true,
        },
      ],
    },
    {
      id: "charges",
      title: "Charges",
      showDivider: true,
      fields: [
        {
          label: "Rent",
          dataKey: "charges.rent",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Electricity",
          dataKey: "charges.electricity",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Water",
          dataKey: "charges.water",
          format: "currency",
          showLabel: true,
        },
      ],
    },
    {
      id: "totals",
      title: "Total",
      showDivider: false,
      fields: [
        {
          label: "Amount Due",
          dataKey: "totals.total",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Paid",
          dataKey: "totals.paid",
          format: "currency",
          showLabel: true,
        },
        {
          label: "Balance",
          dataKey: "totals.remaining",
          format: "currency",
          showLabel: true,
        },
      ],
    },
  ],

  footer: {
    showSignature: false,
    showTermsAndConditions: false,
  },

  styling: {
    colors: {
      primary: "#000000",
      secondary: "#666666",
      text: "#000000",
      border: "#cccccc",
    },
    fonts: {
      title: "Georgia, serif",
      body: "Times New Roman, serif",
      size: {
        title: "24px",
        heading: "16px",
        body: "13px",
        small: "11px",
      },
    },
    spacing: {
      padding: "16px",
      gap: "12px",
    },
  },
};

/**
 * ACTIVE TEMPLATE
 * Currently using: minimalBillTemplate
 */
export { minimalBillTemplate as activeBillTemplate };

/**
 * HOW TO CUSTOMIZE:
 *
 * 1. Change colors:
 *    styling.colors.primary = "#ff0000" (Red bills!)
 *
 * 2. Add/remove fields:
 *    Add to sections[].fields array
 *
 * 3. Change section order:
 *    Reorder items in sections array
 *
 * 4. Hide sections:
 *    Remove section from array or set showDivider: false
 *
 * 5. Change fonts:
 *    styling.fonts.title = "Comic Sans MS" (Please don't!)
 *
 * 6. Switch template:
 *    Change the export above to defaultBillTemplate
 */
