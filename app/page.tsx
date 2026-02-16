// import { Uploader } from "@/components/web/Uploader";

import { signupAction } from "./(auth)/signup/actions";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto flex min-h-screen flex-col items-center justify-center ">
      <h1 className="text-4xl font-bold">Welcome to RentLedger 🏠</h1>
      <p className="text-muted-foreground mt-4">
        Upload and delete functionality is available via API
      </p>

      <Link href="/signup">
        <button>Sign up</button>
      </Link>
      <Link href="/login">
        <button>Log In</button>
      </Link>
    </div>
  );
}
