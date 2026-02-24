import LoginForm from "./login-form";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans text-white relative px-4">
      {/* Background Image (Using a black background as requested, but if you want an image, you'd add it here) */}
      <div className="absolute inset-0 z-0">
         {/* Since you said "as for bg image make it black", I'm making the whole background black instead of adding an image */}
         <div className="w-full h-full bg-black/90" />
      </div>

      {/* Centered Form Container */}
      <div className="w-full max-w-[450px] z-10 flex flex-col items-center">
        {/* Branding / Header */}
        <div className="mb-4 text-center">
             <h1 className="text-[28px] font-normal text-white mb-8 tracking-wide">
                Login <span className="text-gray-300">#10</span>
             </h1>
          <h2 className="text-[32px] font-normal text-white">
            Have an account?
          </h2>
        </div>

        {/* The Login Form Component */}
        <div className="w-full">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
