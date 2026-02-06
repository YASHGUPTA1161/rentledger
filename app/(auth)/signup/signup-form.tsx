"use client";

import { useState } from "react";
import { signupAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormState } from "@/app/lib/definitions";

export default function SignupForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(undefined);
  const [pending, setPending] = useState(false);

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
        <input id="name" name="name" placeholder="Name" defaultValue={state?.fieldValues?.name || ""}/>
        {state?.errors?.name && (
          <p className="text-red-500 text-sm mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="Email" defaultValue={state?.fieldValues?.email || ""}/>
        {state?.errors?.email && (
          <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" defaultValue={state?.fieldValues?.password || ""}/>
        {state?.errors?.password && (
          <p className="text-red-500 text-sm mt-1">{state.errors.password[0]}</p>
        )}
      </div>

      <button type="submit" disabled={pending}>
        {pending ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}