import SignupForm from "./signup-form";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans text-white relative px-4">
      {/* Background Image (Using a black background as requested) */}
      <div className="absolute inset-0 z-0">
         <div className="w-full h-full bg-black/90" />
      </div>

      {/* Centered Form Container */}
      <div className="w-full max-w-[450px] z-10 flex flex-col items-center">
        {/* Branding / Header */}
        <div className="mb-4 text-center">
             <h1 className="text-[28px] font-normal text-white mb-8 tracking-wide">
                Sign Up <span className="text-gray-300">#10</span>
             </h1>
          <h2 className="text-[32px] font-normal text-white">
            Create an account?
          </h2>
        </div>

        {/* The Signup Form Component */}
        <div className="w-full">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
