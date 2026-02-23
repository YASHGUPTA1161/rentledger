// ============================================================
// TENANCY CONSTANTS
// All text, labels, and config for Tenancy/TenantCard UI.
// Change labels here — updates everywhere automatically.
// ============================================================

// ─── Section Titles ──────────────────────────────────────────
export const TENANCY_SECTIONS = {
  personalInfo: "👤 Personal Information",
  rentalDetails: "🏠 Rental Details",
  documents: "📄 Documents",
  inviteStatus: "📧 Invite Status",
} as const;

// ─── Field Labels ────────────────────────────────────────────
export const TENANCY_FIELD_LABELS = {
  fullName: "Full Name",
  email: "Email",
  phone: "Phone",
  permanentAddress: "Permanent Address",
  rentAmount: "Rent Amount (₹)",
  deposit: "Deposit (₹)",
  moveInDate: "Move In Date",
  leaseEndDate: "Lease End Date",
  policeVerificationDate: "Police Verification Date",
  dateOfBirth: "Date of Birth",
  idProofType: "ID Proof Type",
  idProofNumber: "ID Proof Number",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactPhone: "Emergency Contact Phone",
  occupation: "Occupation",
  numberOfOccupants: "Number of Occupants",
} as const;

// ─── Button Labels ───────────────────────────────────────────
export const TENANCY_LABELS = {
  sendInvite: "📧 Send Invite",
  sendingInvite: "Sending...",
  copyLink: "🔗 Copy Link",
  copyingLink: "Copying...",
  endTenancy: "End Tenancy",
  addTenant: "+ Add Tenant",
  noActiveTenant: "No active tenant",
  inviteSent: "Invite Sent!",
  inviteResend: "Resend Invite",
} as const;

// ─── Invite Status Labels ────────────────────────────────────
export const INVITE_STATUS = {
  notSent: "Not sent",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
} as const;

// ─── Toast Messages ──────────────────────────────────────────
export const TENANCY_TOASTS = {
  inviteSent: "Invite sent successfully!",
  inviteFailed: "Failed to send invite",
  linkCopied: "Link copied to clipboard!",
  linkFailed: "Failed to copy link",
  fieldSaved: "Saved",
  fieldFailed: "Failed to save",
  tenancyEnded: "Tenancy ended",
  tenancyEndFailed: "Failed to end tenancy",
} as const;

// ─── ID Proof Types ──────────────────────────────────────────
export const ID_PROOF_TYPES = [
  { value: "", label: "Select..." },
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING", label: "Driving Licence" },
  { value: "VOTER", label: "Voter ID" },
] as const;
