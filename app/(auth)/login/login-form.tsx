"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormState, LoginFormSchema } from "@/app/lib/definitions";
import { toast } from "sonner";
import { loginAction } from "./actions";

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
    </form>
  );
}
