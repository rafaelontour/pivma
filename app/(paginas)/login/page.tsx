import { AuthCard } from "./auth-card";
import type { InfoCardProps } from "@/types/Interface";

export default function Page() {
  return (
    <main className="relative isolate min-h-dvh overflow-x-hidden bg-[#efeef1] px-4 py-3 text-slate-800 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.13),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"
      />

      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col">
        <header className="flex shrink-0 items-center gap-3 py-2 sm:py-3">
          <BrandMark />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                pi*VMA
              </span>
              <span className="rounded-full border border-teal-700/20 bg-teal-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800">
                BraCVAM
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Plataforma Integrada de Validação de Métodos Alternativos
            </p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 items-center gap-5 py-2 lg:grid-cols-[minmax(0,1fr)_34rem] lg:gap-12 lg:py-3">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              <span className="h-px w-8 bg-teal-600" />
              Ambiente seguro
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Validação colaborativa, com rigor e rastreabilidade.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Centralize o ciclo de validação de métodos alternativos, da
              submissão técnica à avaliação especializada, em um ambiente
              governado pela BraCVAM e Fiocruz.
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
              <InfoCard
                label="Fluxos integrados"
                text="Submissão, triagem e avaliação em uma única plataforma."
              />
              <InfoCard
                label="Governança técnica"
                text="Perfis de acesso e histórico de decisões auditáveis."
              />
            </div>
          </div>

          <AuthCard />
        </section>

        <footer className="shrink-0 border-t border-slate-300 py-3 text-center text-[11px] text-slate-500 sm:text-left">
          pi*VMA · Plataforma de Validação de Métodos Alternativos · BraCVAM /
          Fiocruz
        </footer>
      </div>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-lg shadow-teal-500/20">
      <svg
        aria-hidden="true"
        className="size-6 text-slate-900"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M7 4c5 0 5 16 10 16M17 4C12 4 12 20 7 20M8.5 7h7M8.5 12h7M8.5 17h7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function InfoCard({ label, text }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-300/40">
      <p className="text-sm font-semibold text-teal-800">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
}
