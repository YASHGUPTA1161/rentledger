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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 w-full max-w-sm"
    >
      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-600 mb-1"
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          defaultValue={state?.fieldValues?.email || ""}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {(clientErrors.email || state?.errors?.email) && (
          <p className="text-red-500 text-xs mt-1.5 ml-1">
            {clientErrors.email
              ? clientErrors.email[0]
              : state?.errors?.email?.[0]}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-gray-600 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          defaultValue={state?.fieldValues?.password || ""}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {(clientErrors.password || state?.errors?.password) && (
          <p className="text-red-500 text-xs mt-1.5 ml-1">
            {clientErrors.password
              ? clientErrors.password[0]
              : state?.errors?.password?.[0]}
          </p>
        )}

        {/* Forgot Password Line */}
        <div className="flex justify-between items-center mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remember Me
          </label>
          <span className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer transition-colors">
            Forgot Password?
          </span>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex gap-4 mt-2">
        <button
          type="submit"
          disabled={pending}
          className={`flex-1 py-3 px-4 rounded-md shadow-md text-sm font-bold text-white transition-all
            ${pending ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"}`}
        >
          {pending ? "Logging In..." : "Login"}
        </button>

        {/* Simple navigation to signup to match reference layout options */}
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="flex-1 py-3 px-4 rounded-md border border-blue-200 text-blue-600 text-sm font-bold hover:bg-blue-50 transition-all active:scale-[0.98]"
        >
          Sign Up
        </button>
      </div>

      {/* Social Logins */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
            Or login with
          </span>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full py-2.5 px-4 flex items-center justify-center gap-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-black"
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
              Google
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
