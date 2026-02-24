// All docs content lives here — edit this file to update any doc text.
// forRole: "both" | "landlord" | "tenant"

export interface DocItem {
  question: string;
  answer: string;
}

export interface DocSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  forRole: "both" | "landlord" | "tenant";
  items: DocItem[];
}

export const docsSections: DocSection[] = [
  {
    id: "billing",
    icon: "📊",
    title: "Billing & Ledger",
    description: "How rent, bills, and carry-forward amounts are calculated.",
    forRole: "both",
    items: [
      {
        question: "How is the monthly bill calculated?",
        answer:
          "Each bill = Rent + Electricity + Water + Previous carry-forward balance. The landlord enters meter readings and RentLedger computes the electricity cost automatically using the per-unit rate set on the property.",
      },
      {
        question: "What is carry-forward?",
        answer:
          "If a tenant pays less than the total due, the unpaid balance is carried forward to the next month's bill automatically. It shows as a separate line item so both parties can track it clearly.",
      },
      {
        question: "When does a bill become 'overdue'?",
        answer:
          "A bill is marked overdue when its due date has passed and the status is still 'pending' or 'partial'. Landlords can set the due date per bill.",
      },
      {
        question: "How do I record a partial payment? (Landlord)",
        answer:
          "Open the tenant's bill and enter the amount paid. RentLedger calculates the remaining balance and carries it forward automatically.",
      },
      {
        question: "Where can I see my bill details? (Tenant)",
        answer:
          "Go to your dashboard and open the Bills tab. Each bill shows the breakdown: rent, electricity, water, carry-forward, and total due.",
      },
    ],
  },
  {
    id: "documents",
    icon: "📄",
    title: "Documents",
    description: "Uploading, storing, and downloading rent receipts and files.",
    forRole: "both",
    items: [
      {
        question: "What file types can I upload?",
        answer:
          "PDFs and images (JPG, PNG) are supported. Maximum file size is 10 MB per file. Files are stored securely in S3-compatible storage.",
      },
      {
        question: "How do I upload a rent receipt? (Landlord)",
        answer:
          "Navigate to the tenant's property page → Documents tab → click Upload. Select the file and it will be attached to that tenant's record.",
      },
      {
        question: "Can tenants see their documents?",
        answer:
          "Yes. All documents attached to a tenant's tenancy are visible in their Documents tab on the dashboard.",
      },
      {
        question: "How long are documents stored?",
        answer:
          "Documents are stored indefinitely as long as your account is active. If you end a tenancy, documents are retained for reference.",
      },
    ],
  },
  {
    id: "notifications",
    icon: "🔔",
    title: "Notifications",
    description: "When notifications are sent and how bulk messaging works.",
    forRole: "both",
    items: [
      {
        question: "How do I send a notification to my tenants? (Landlord)",
        answer:
          "Click the 🔔 bell icon in the top navbar. Select a pre-built template (Reminder, Overdue Notice, or Invoice), check the tenants to notify, and click Send. Optionally enable 'Also send via email' to deliver it to their inbox too.",
      },
      {
        question: "What are the pre-built templates?",
        answer:
          "1. Rent Reminder — general reminder that rent is due soon.\n2. Overdue Notice — notice that payment is now overdue.\n3. Send Invoice — includes a bill summary with rent, electricity, water, and total due.",
      },
      {
        question: "Where do I see my notifications? (Tenant)",
        answer:
          "The 🔔 bell icon in the navbar shows your unread count. All notifications are visible in your Notifications page. You can mark them as read.",
      },
      {
        question: "Is bulk notification a paid feature?",
        answer:
          "Bulk notifications will be part of the Pro tier. The toggle in the popup lets you enable or disable it. Full pricing details coming soon.",
      },
    ],
  },
  {
    id: "tenancy",
    icon: "🏠",
    title: "Tenancy Rules",
    description: "How invites, leases, and role permissions work.",
    forRole: "both",
    items: [
      {
        question: "How do I invite a tenant? (Landlord)",
        answer:
          "Go to a property → Tenants tab → click 'Send Invite'. Enter the tenant's email. They get a link to set their password and access their dashboard. The link expires in 7 days.",
      },
      {
        question: "What can a tenant do on the dashboard?",
        answer:
          "Tenants can: view their bills and payment history, download documents and receipts, raise maintenance requests, and view their lease details. They cannot edit bills or property settings.",
      },
      {
        question: "What can a landlord do that a tenant cannot?",
        answer:
          "Landlords manage properties, create and edit bills, upload documents, send notifications, and invite tenants. Landlords see all tenants; a tenant only sees their own data.",
      },
      {
        question: "How do I end a tenancy? (Landlord)",
        answer:
          "Go to the property → Tenancy tab → mark the tenancy as ended. The tenant's dashboard access is revoked. Historical bills and documents are preserved.",
      },
      {
        question: "Can a tenant have multiple active tenancies?",
        answer:
          "No. A tenant account is linked to one active tenancy at a time. A landlord can have unlimited properties and tenants.",
      },
    ],
  },
  {
    id: "faq",
    icon: "❓",
    title: "FAQ",
    description: "Common questions answered quickly.",
    forRole: "both",
    items: [
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "Currently use the 'Forgot Password' link on the login page, or contact your landlord to re-send an invite link which lets you set a new password.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Yes. Passwords are hashed with bcrypt. Sessions use signed JWT cookies. Files are stored in private S3 buckets. We never store plain-text passwords or card numbers.",
      },
      {
        question: "Can I use RentLedger on mobile?",
        answer:
          "The dashboard works on mobile browsers. A dedicated mobile app is on the roadmap.",
      },
      {
        question: "How do I report a bug or request a feature?",
        answer:
          "Use the Contact page (link in the navbar). Select the appropriate category — Bug Report or Feature Request — and describe the issue.",
      },
      {
        question: "Will there be a free plan?",
        answer:
          "Yes. The free tier includes core features. Advanced features like bulk notifications and analytics will be part of the Pro plan. Join the waitlist via the Pricing page to get 1 month free.",
      },
    ],
  },
];
