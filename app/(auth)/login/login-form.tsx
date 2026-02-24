"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormState, LoginFormSchema } from "@/app/lib/definitions";
import { toast } from "sonner";
import { loginAction } from "./actions";
import { signIn } from "next-auth/react";

type LoginField = keyof typeof LoginFormSchema.shape;

export default function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(undefined);
  const [pending, setPending] = useState(false);
  const [clientErrors, setClientErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!(name in LoginFormSchema.shape)) return;

    const fieldName = name as LoginField;
    const fieldSchema = LoginFormSchema.shape[fieldName];

    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      setClientErrors((prev) => ({
        ...prev,
        [fieldName]: result.error.issues.map((issue) => issue.message),
      }));
    } else {
      setClientErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setPending(true);
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const result = await loginAction(formData);

    setState(result);
    setPending(false);

    if (result?.message) {
      toast.success(result.message);
      setTimeout(() => router.push("/"), 1500);
    }
  }
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          defaultValue={state?.fieldValues?.email || ""}
          onChange={handleInputChange}
        />
        {(clientErrors.email || state?.errors?.email) && (
          <p className="text-red-500 text-sm mt-1">
            {clientErrors.email
              ? clientErrors.email[0]
              : state?.errors?.email?.[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue={state?.fieldValues?.password || ""}
          onChange={handleInputChange}
        />
        {(clientErrors.password || state?.errors?.password) && (
          <p className="text-red-500 text-sm mt-1">
            {clientErrors.password
              ? clientErrors.password[0]
              : state?.errors?.password?.[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending}>
        {pending ? "Logging In..." : "Log In"}
      </button>

      <div
        style={{
          margin: "16px 0",
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "0.85rem",
        }}
      >
        or
      </div>

      <button
        type="button"
        onClick={() => signIn("google")}
        style={{
          width: "100%",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "0.95rem",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3L37 10C33.6 6.9 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.5 0 18-7.5 18-19 0-1.3-.1-2.7-.4-4z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3L37 10C33.6 6.9 29 5 24 5c-7.6 0-14.2 4.3-17.7 9.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 43c5.2 0 9.9-1.8 13.5-4.7L31 33.9C29.2 35.2 27 36 24 36c-5.3 0-9.6-2.9-11.3-7l-6.6 5.1C9.7 38.7 16.4 43 24 43z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.5-4.7 5.9l6.5 4.4C41 34.6 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"
          />
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}
