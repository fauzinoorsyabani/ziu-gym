import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, Check, Dumbbell, Menu, MoveRight, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const programs = [
  { number: "01", title: "Strength", detail: "Bangun fondasi yang membuat setiap gerakan terasa lebih kuat." },
  { number: "02", title: "Conditioning", detail: "Latih mesin tubuh untuk ritme hidup yang tidak setengah-setengah." },
  { number: "03", title: "Mobility", detail: "Jaga ruang gerak, kontrol, dan recovery untuk perjalanan jangka panjang." },
];

const benefits = ["Ruang latihan yang terarah", "Program yang mudah diikuti", "Pendekatan untuk progres berkelanjutan"];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const enterDashboard = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
      return;
    }
    startLogin();
  };

  return (
    <div className="min-h-screen bg-[#101111] text-[#f6f6ef] selection:bg-[#d9ff3f] selection:text-[#11130e]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#101111]/82 backdrop-blur-xl">
        <div className="container flex h-18 items-center justify-between gap-4 py-4">
          <button onClick={() => setLocation("/")} className="group flex items-center gap-2 text-left" aria-label="Ziu Gym beranda">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9ff3f] text-[#151810] transition-transform duration-200 group-hover:rotate-12">
              <Dumbbell className="h-4 w-4" strokeWidth={2.7} />
            </span>
            <span className="font-display text-lg font-bold tracking-[-0.06em]">ZIU GYM</span>
          </button>

          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex" aria-label="Navigasi utama">
            <a href="#program" className="transition-colors hover:text-white">Program</a>
            <a href="#mengapa-ziu" className="transition-colors hover:text-white">Mengapa Ziu</a>
            <a href="#membership" className="transition-colors hover:text-white">Membership</a>
          </nav>

          <div className="hidden md:block">
            <Button onClick={enterDashboard} className="rounded-full bg-[#d9ff3f] px-5 text-[#151810] hover:bg-[#edff94]">
              {isAuthenticated ? "Dashboard" : "Masuk dashboard"}
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
          <button onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 md:hidden" aria-label="Buka navigasi">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#101111] px-5 pb-6 pt-4 md:hidden">
            <nav className="mx-auto flex max-w-xl flex-col gap-3 text-base text-white/75" aria-label="Navigasi seluler">
              <a onClick={() => setMenuOpen(false)} href="#program" className="rounded-xl px-2 py-2 hover:bg-white/5">Program</a>
              <a onClick={() => setMenuOpen(false)} href="#mengapa-ziu" className="rounded-xl px-2 py-2 hover:bg-white/5">Mengapa Ziu</a>
              <a onClick={() => setMenuOpen(false)} href="#membership" className="rounded-xl px-2 py-2 hover:bg-white/5">Membership</a>
              <Button onClick={enterDashboard} className="mt-2 rounded-full bg-[#d9ff3f] text-[#151810] hover:bg-[#edff94]">Masuk dashboard</Button>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden px-4 pb-14 pt-35 sm:px-6 sm:pb-20 sm:pt-42">
          <div className="ziu-grid pointer-events-none absolute inset-0 -z-20 opacity-70" />
          <div className="pointer-events-none absolute -right-28 top-14 -z-10 h-92 w-92 rounded-full bg-[#d9ff3f]/15 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 left-[8%] -z-10 h-64 w-64 rounded-full bg-[#6b8946]/18 blur-[100px]" />
          <div className="container grid items-end gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
            <div className="rise-in">
              <div className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d9ff3f]">
                <span className="h-px w-8 bg-[#d9ff3f]" />
                Ruang untuk berkembang
              </div>
              <h1 className="font-display max-w-5xl text-[clamp(3.7rem,10.7vw,9.5rem)] font-bold leading-[0.84] tracking-[-0.095em] text-[#f5f5ed]">
                BUILD<br />YOUR <span className="text-[#d9ff3f]">BEST.</span>
              </h1>
              <div className="mt-9 flex max-w-xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-xs text-base leading-7 text-white/62">Ziu Gym adalah ruang latihan untuk membangun kebiasaan yang terasa nyata—setiap repetisi, setiap hari.</p>
                <Button onClick={() => document.querySelector("#program")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="group w-fit rounded-full border-white/20 bg-transparent px-5 text-white hover:border-[#d9ff3f] hover:bg-[#d9ff3f] hover:text-[#151810]">
                  Temukan ritmemu <ArrowDownRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>

            <div className="rise-in relative border border-white/10 bg-[#20211d]/80 p-5 [animation-delay:100ms] sm:p-7">
              <div className="absolute right-0 top-0 h-20 w-20 border-b border-l border-[#d9ff3f]/70" />
              <div className="mb-14 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/45">
                <span>ZIU / 2026</span>
                <Sparkles className="h-4 w-4 text-[#d9ff3f]" />
              </div>
              <p className="font-display text-3xl font-semibold leading-none tracking-[-0.06em] sm:text-4xl">Bukan tentang cepat.<br />Tentang konsisten.</p>
              <div className="mt-10 grid grid-cols-2 border-t border-white/10 pt-5 text-sm">
                <div className="border-r border-white/10 pr-4"><span className="block text-white/40">Fokus</span><span className="mt-1 block font-medium">Kekuatan & kontrol</span></div>
                <div className="pl-4"><span className="block text-white/40">Cara kerja</span><span className="mt-1 block font-medium">Progress, bukan tekanan</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="program" className="border-y border-white/10 bg-[#171916] px-4 py-18 sm:px-6 sm:py-24">
          <div className="container">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 sm:flex-row sm:items-end">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">Pilih cara bergerak</p><h2 className="font-display mt-3 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">PROGRAM DENGAN<br />ARAH YANG JELAS.</h2></div>
              <p className="max-w-xs text-sm leading-6 text-white/50">Mulai dari apa yang tubuhmu butuhkan hari ini, kemudian progres dengan ritmemu sendiri.</p>
            </div>
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
              {programs.map((program) => (
                <article key={program.number} className="group relative min-h-70 bg-[#171916] p-6 transition-colors duration-200 hover:bg-[#242720] sm:p-8">
                  <span className="font-display text-sm text-[#d9ff3f]">{program.number}</span>
                  <div className="absolute right-6 top-6 rounded-full border border-white/10 p-2.5 text-white/50 transition-all duration-200 group-hover:border-[#d9ff3f] group-hover:bg-[#d9ff3f] group-hover:text-[#151810]"><MoveRight className="h-4 w-4" /></div>
                  <div className="absolute inset-x-6 bottom-7 sm:inset-x-8"><h3 className="font-display text-3xl font-semibold tracking-[-0.055em]">{program.title}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-white/50">{program.detail}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="mengapa-ziu" className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="container grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-22">
            <div className="flex flex-col justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">Latihan yang relevan</p><h2 className="font-display mt-3 text-5xl font-semibold leading-[0.92] tracking-[-0.075em]">MULAI DARI<br />TUBUHMU.</h2></div><div className="mt-12 flex items-center gap-3 text-sm text-white/45"><span className="h-2 w-2 rounded-full bg-[#d9ff3f]" /> Tidak ada garis akhir untuk bertumbuh.</div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#d9ff3f] p-7 text-[#171916] sm:p-9"><Dumbbell className="h-7 w-7" strokeWidth={2.4} /><p className="font-display mt-20 text-3xl font-semibold leading-[0.98] tracking-[-0.06em]">Kuat bukan gaya.<br />Ini kebiasaan.</p></div>
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#20221e] p-7 sm:p-9"><p className="text-sm leading-7 text-white/60">Satu jam yang kamu pegang untuk diri sendiri dapat menjadi fondasi untuk sisa harimu.</p><div className="mt-18 space-y-3">{benefits.map((benefit) => <div key={benefit} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-[#d9ff3f]" /><span>{benefit}</span></div>)}</div></div>
            </div>
          </div>
        </section>

        <section id="membership" className="px-4 pb-20 sm:px-6 sm:pb-28"><div className="container overflow-hidden rounded-[2rem] border border-white/10 bg-[#e9ebdc] text-[#161812]"><div className="grid lg:grid-cols-[0.9fr_1.1fr]"><div className="p-8 sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6a7553]">Membership Ziu</p><h2 className="font-display mt-4 text-5xl font-semibold leading-[0.9] tracking-[-0.075em] sm:text-6xl">PILIH<br />MOMENMU.</h2><p className="mt-7 max-w-sm text-sm leading-7 text-[#56604a]">Tidak ada satu paket untuk semua orang. Cari bentuk komitmen yang membantumu terus datang.</p></div><div className="border-t border-[#161812]/12 p-4 lg:border-l lg:border-t-0 sm:p-6"><div className="grid gap-3">{[["Flex", "Untuk membangun ritme latihan yang baru."], ["Unlimited", "Untuk hari-hari ketika latihan adalah prioritas."], ["Coach", "Untuk progres dengan arah yang lebih personal."]].map(([name, detail], index) => <button key={name} onClick={enterDashboard} className="group flex items-center justify-between rounded-2xl border border-[#161812]/12 px-5 py-5 text-left transition-colors hover:bg-[#171916] hover:text-white sm:px-6"><div><span className="font-display text-xl font-semibold tracking-[-0.04em]">{name}</span><span className="mt-1 block text-sm opacity-65">{detail}</span></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171916] text-white transition-colors group-hover:bg-[#d9ff3f] group-hover:text-[#171916]"><ArrowUpRight className="h-4 w-4" /></span></button>)}</div></div></div></div></section>

        <section className="border-t border-white/10 px-4 py-18 sm:px-6"><div className="container flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9ff3f]">Untuk tim Ziu</p><h2 className="font-display mt-3 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">KELOLA MEMBER,<br />JAGA MOMENTUM.</h2></div><Button onClick={enterDashboard} className="rounded-full bg-[#d9ff3f] px-6 text-[#161812] hover:bg-[#edff94]">Buka dashboard <ArrowUpRight className="ml-2 h-4 w-4" /></Button></div></section>
      </main>
      <footer className="border-t border-white/10 px-4 py-7 sm:px-6"><div className="container flex flex-col gap-3 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between"><span className="font-display font-semibold tracking-[-0.04em] text-white/65">ZIU GYM</span><span>Build your best, one session at a time.</span></div></footer>
    </div>
  );
}
