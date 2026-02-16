/**
 * User-Friendly Error Messages
 * Converts technical errors into helpful alerts with troubleshooting tips
 */

type ErrorType =
  | "db_connection"
  | "validation"
  | "permission"
  | "not_found"
  | "duplicate"
  | "unknown";

interface ErrorResponse {
  type: ErrorType;
  title: string;
  message: string;
  tips?: string[];
}

/**
 * Parse Prisma/DB errors and return user-friendly messages
 */
export function getUserFriendlyError(error: unknown): ErrorResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // DATABASE CONNECTION ERRORS
  if (
    errorMessage.includes("Can't reach database") ||
    errorMessage.includes("Connection refused") ||
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("Server has closed the connection") ||
    errorMessage.includes("timeout")
  ) {
    return {
      type: "db_connection",
      title: "⚠️ Database Connection Failed",
      message: "Cannot connect to the database. This might be a network issue.",
      tips: [
        "✓ Turn OFF your VPN and try again",
        "✓ Check your internet connection",
        "✓ Wait 30 seconds and retry",
        "✓ Contact support if problem persists",
      ],
    };
  }

  // VALIDATION: Cannot create bill without tenancy
  if (errorMessage.includes("tenancy") && errorMessage.includes("not found")) {
    return {
      type: "validation",
      title: "❌ Missing Tenancy",
      message: "You must create a tenancy first before creating bills.",
      tips: [
        "1. Go to the Tenancy tab",
        "2. Create a tenancy for your tenant",
        "3. Then you can create bills",
      ],
    };
  }

  // VALIDATION: Cannot create ledger entry without bill
  if (errorMessage.includes("bill") && errorMessage.includes("not found")) {
    return {
      type: "validation",
      title: "❌ Missing Bill",
      message: "You must create a bill first before adding ledger entries.",
      tips: [
        "1. Go to the Bills tab",
        "2. Create a bill for the month",
        "3. Then you can add entries",
      ],
    };
  }

  // PERMISSION ERRORS
  if (
    errorMessage.includes("Unauthorized") ||
    errorMessage.includes("permission") ||
    errorMessage.includes("not your")
  ) {
    return {
      type: "permission",
      title: "🔒 Permission Denied",
      message: "You don't have permission to perform this action.",
      tips: ["This property or record belongs to another user"],
    };
  }

  // NOT FOUND ERRORS
  if (
    errorMessage.includes("not found") ||
    errorMessage.includes("does not exist")
  ) {
    return {
      type: "not_found",
      title: "❓ Record Not Found",
      message: "The item you're looking for doesn't exist or was deleted.",
      tips: ["Refresh the page and try again"],
    };
  }

  // DUPLICATE ERRORS
  if (
    errorMessage.includes("unique") ||
    errorMessage.includes("already exists") ||
    errorMessage.includes("duplicate")
  ) {
    return {
      type: "duplicate",
      title: "⚠️ Duplicate Record",
      message: "A record with this information already exists.",
      tips: ["Check if you already created this", "Try using different values"],
    };
  }

  // EDIT WINDOW EXPIRED
  if (
    errorMessage.includes("24 hours") ||
    errorMessage.includes("Edit window expired")
  ) {
    return {
      type: "validation",
      title: "⏰ Edit Time Expired",
      message: "This entry is older than 24 hours and cannot be edited.",
      tips: [
        "Entries can only be edited within 24 hours of creation",
        "Create a new adjustment entry instead",
      ],
    };
  }

  // VERIFIED ENTRY
  if (
    errorMessage.includes("verified") ||
    errorMessage.includes("tenant already approved")
  ) {
    return {
      type: "validation",
      title: "✓ Entry Verified",
      message:
        "This entry has been verified by the tenant and cannot be changed.",
      tips: ["Contact the tenant to unverify if changes are needed"],
    };
  }

  // DEFAULT: Unknown error
  return {
    type: "unknown",
    title: "❌ Something Went Wrong",
    message: errorMessage || "An unexpected error occurred.",
    tips: [
      "Try refreshing the page",
      "If problem persists, contact support",
      `Error: ${errorMessage.substring(0, 100)}...`,
    ],
  };
}

/**
 * Display user-friendly error as browser alert
 */
export function showErrorAlert(error: unknown): void {
  const friendlyError = getUserFriendlyError(error);

  let alertMessage = `${friendlyError.title}\n\n${friendlyError.message}`;

  if (friendlyError.tips && friendlyError.tips.length > 0) {
    alertMessage += "\n\n💡 TROUBLESHOOTING:\n" + friendlyError.tips.join("\n");
  }

  alert(alertMessage);
}

/**
 * Return formatted error for server actions
 */
export function getErrorMessage(error: unknown): string {
  const friendlyError = getUserFriendlyError(error);

  let message = `${friendlyError.title}\n${friendlyError.message}`;

  if (friendlyError.tips && friendlyError.tips.length > 0) {
    message += "\n\n💡 Tips:\n" + friendlyError.tips.join("\n");
  }

  return message;
}
