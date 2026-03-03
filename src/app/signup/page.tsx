import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "@/features/auth/SignupForm";
import { BackgroundBeamsWithCollision } from "@/shared/ui/background-beams-with-collision";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap bg-white/50 backdrop-blur-md px-4 py-3 lg:px-40 border-b border-white/20">
        <Link href="/" className="flex items-center gap-3 lg:gap-4">
          <Image
            src="/eluo-logo.svg"
            alt="ELUO logo"
            width={32}
            height={32}
            priority
          />
          <h2 className="font-eluo text-slate-900 text-base lg:text-lg font-bold leading-tight tracking-tight">
            ELUO AI SKILL HUB
          </h2>
        </Link>
        <Link
          href="/signin"
          className="flex min-w-[76px] lg:min-w-[84px] cursor-pointer items-center justify-center rounded-[8px] h-9 lg:h-10 px-3 lg:px-4 bg-brand-navy text-white text-xs lg:text-sm font-bold leading-normal hover:bg-[#0000A0] transition-colors shadow-sm"
        >
          로그인
        </Link>
      </header>

      {/* Main */}
      <BackgroundBeamsWithCollision
        className="flex-1 h-auto bg-brand-light py-10"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(254,254,1,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,127,0.10) 0px, transparent 50%)",
        }}
      >
        <SignupForm />
      </BackgroundBeamsWithCollision>
    </div>
  );
}
