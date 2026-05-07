"use client";

import Link from "next/link";
import Image from "next/image";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="relative overflow-hidden bg-[#030712] text-white min-h-screen">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,103,255,0.30),transparent_35%),linear-gradient(to_bottom,#020617,#020817)]" />

      {/* subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')",
        }}
      />

      <div className="relative z-10 max-w-[1380px] mx-auto px-8 lg:px-12">
        {/* NAV */}
        <header className="h-[105px] border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-[44px] h-[44px] rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl">
              Z
            </div>

            <span className="text-[28px] font-black tracking-tight">
              Zyprent
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-14 text-[17px] font-semibold text-white/92">
            <Link href="/">Home</Link>
            <Link href="/#solution">Solution</Link>
            <Link href="/#platform">Platform</Link>
            <Link href="/experiences">Experiences</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>

          <div className="flex items-center gap-7">
            <Link
              href="/login"
              className="hidden md:block text-[17px] font-semibold text-white/90"
            >
              Sign In
            </Link>

            <a
              href={DEMO_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[54px] px-8 rounded-2xl bg-gradient-to-r from-[#6EA8FF] to-[#5B61FF] flex items-center justify-center font-bold text-[17px] shadow-[0_0_35px_rgba(92,107,255,0.45)] transition-all duration-300 hover:scale-[1.03]"
            >
              Request Demo
            </a>
          </div>
        </header>

        {/* HERO */}
        <section className="relative grid lg:grid-cols-[0.95fr_1.05fr] items-center min-h-[calc(100vh-105px)] pt-10 pb-16">
          {/* LEFT */}
          <div className="relative z-20 max-w-[620px]">
            <p className="text-[#6EA8FF] uppercase tracking-[0.22em] text-[15px] font-bold mb-8">
              Welcome to Zyprent Experiences
            </p>

            <h1 className="text-[68px] leading-[0.93] font-black tracking-[-0.05em]">
              Property work,
              <br />
              built around
              <br />
              real people.
            </h1>

            <p className="mt-10 text-[22px] leading-[1.65] text-white/78 max-w-[620px]">
              Residents, managers, providers and investors stay connected
              through one clean property workflow.
            </p>

            <div className="flex flex-wrap gap-5 mt-12">
              <a
                href={DEMO_FORM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[68px] px-10 rounded-[22px] bg-gradient-to-r from-[#6EA8FF] to-[#5B61FF] flex items-center justify-center text-[20px] font-bold shadow-[0_0_40px_rgba(92,107,255,0.40)]"
              >
                Request Demo
              </a>

              <Link
                href="/login"
                className="h-[68px] px-10 rounded-[22px] border border-white/12 bg-white/[0.03] backdrop-blur-md flex items-center justify-center text-[20px] font-bold hover:bg-white/[0.06] transition-all"
              >
                Explore Platform
              </Link>
            </div>

            {/* users */}
            <div className="flex items-center gap-5 mt-14">
              <div className="flex -space-x-4">
                <div className="w-[56px] h-[56px] rounded-full overflow-hidden border-[3px] border-[#030712]">
                  <Image
                    src="/experiences/avatar1.jpg"
                    alt="user"
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>

                <div className="w-[56px] h-[56px] rounded-full overflow-hidden border-[3px] border-[#030712]">
                  <Image
                    src="/experiences/avatar2.jpg"
                    alt="user"
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>

                <div className="w-[56px] h-[56px] rounded-full overflow-hidden border-[3px] border-[#030712]">
                  <Image
                    src="/experiences/avatar3.jpg"
                    alt="user"
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
              </div>

              <div>
                <p className="font-bold text-[24px] leading-none">
                  Built for every role
                </p>

                <p className="text-white/65 text-[18px] mt-2">
                  Residents · Managers · Providers · Investors
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative h-[880px] flex items-end justify-end">
            {/* blue glow */}
            <div className="absolute right-[80px] top-[80px] w-[700px] h-[700px] rounded-full bg-[#3467ff]/30 blur-[120px]" />

            {/* hero person */}
            <div className="absolute right-[-10px] bottom-0 z-10">
              <Image
                src="/experiences/hero-person.png"
                alt="Professional"
                width={820}
                height={980}
                priority
                className="w-auto h-[920px] object-contain select-none"
              />
            </div>

            {/* floating cards */}
            <div className="absolute top-[170px] left-[40px] z-20 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl px-8 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-5">
                <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-br from-[#5B61FF] to-[#6EA8FF] flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect
                      x="4"
                      y="5"
                      width="16"
                      height="14"
                      rx="2"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 10H16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-white/55 text-[14px] uppercase tracking-[0.15em] font-bold">
                    Resident Payment
                  </p>

                  <p className="text-[22px] font-black mt-1">
                    Receipt saved
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute right-[10px] top-[360px] z-20 rounded-[32px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl px-10 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
              <div className="w-[62px] h-[62px] rounded-2xl bg-gradient-to-br from-[#5B61FF] to-[#6EA8FF] flex items-center justify-center mb-7">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="10"
                    width="3"
                    height="8"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="10"
                    y="6"
                    width="3"
                    height="12"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="16"
                    y="3"
                    width="3"
                    height="15"
                    rx="1.5"
                    fill="white"
                  />
                </svg>
              </div>

              <p className="text-[62px] font-black leading-none">550+</p>

              <p className="mt-3 text-white/65 text-[18px] uppercase tracking-[0.08em] font-bold">
                Actions tracked
              </p>
            </div>

            <div className="absolute left-[40px] bottom-[130px] z-20 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl px-8 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-5">
                <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-br from-[#5B61FF] to-[#6EA8FF] flex items-center justify-center">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="9" cy="8" r="3" stroke="white" strokeWidth="2" />
                    <circle
                      cx="17"
                      cy="8"
                      r="3"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 18C4 15.7909 5.79086 14 8 14H10C12.2091 14 14 15.7909 14 18"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M13 18C13 16.3431 14.3431 15 16 15H18C19.6569 15 21 16.3431 21 18"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-white/55 text-[14px] uppercase tracking-[0.15em] font-bold">
                    Team Workflow
                  </p>

                  <p className="text-[22px] font-black mt-1">
                    Manager approved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}