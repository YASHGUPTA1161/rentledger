import toast from "react-hot-toast";

export const showToast = {
  // Success toast
  success: (message: string) => {
    toast.success(message);
  },

  // Error toast
  error: (message: string) => {
    toast.error(message);
  },

  // Warning toast
  warning: (message: string) => {
    toast(message, {
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#fff",
      },
    });
  },

  // Info toast
  info: (message: string) => {
    toast(message, {
      icon: "ℹ️",
      style: {
        background: "#3b82f6",
        color: "#fff",
      },
    });
  },
};
