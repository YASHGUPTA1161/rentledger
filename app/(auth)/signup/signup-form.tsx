"use client";

import { useState } from "react";
import { signupAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormState, SignupFormSchema } from "@/app/lib/definitions";

type SignupField = keyof typeof SignupFormSchema.shape;

export default function SignupForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(undefined);
  const [pending, setPending] = useState(false);
  const [clientErrors, setClientErrors] = useState<{
    name?: string[];
    email?: string[];
    password?: string[];
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!(name in SignupFormSchema.shape)) return;

    const fieldName = name as SignupField;
    const fieldSchema = SignupFormSchema.shape[fieldName];

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent page refresh
    setPending(true); // Start loading

    const formData = new FormData(e.target as HTMLFormElement);
    const result = await signupAction(formData);

    setState(result); // Update state with errors or success
    setPending(false); // Stop loading

    // Handle success
    if (result?.message) {
      toast.success(result.message);
      setTimeout(() => router.push("/"), 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          placeholder="Name"
          defaultValue={state?.fieldValues?.name || ""}
          onChange={handleInputChange}
        />
        {(clientErrors.name || state?.errors?.name) && (
          <p className="text-red-500 text-sm mt-1">
            {clientErrors.name
              ? clientErrors.name[0]
              : state?.errors?.name?.[0]}
          </p>
        )}
      </div>

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
        {pending ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}
