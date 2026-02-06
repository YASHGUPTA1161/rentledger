"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useActionState } from "react";
import { FormState } from "@/app/lib/definitions";
import { toast } from "sonner";
import { loginAction } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(undefined);
  const [pending, setPending] = useState(false);

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
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue={state?.fieldValues?.password || ""}
        />
        {state?.errors?.password && (
          <p className="text-red-500 text-sm mt-1">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending}>
        {pending ? "Logging In..." : "Log In"}
      </button>
    </form>
  );
}
