import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Download,
  Layers3,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const workflowSteps = [
  {
    title: "Kredi satın alın",
    description: "İhtiyacınıza uygun kredi paketini seçin.",
  },
  {
    title: "KML dosyanızı yükleyin",
    description: "Arazi veya koordinat verilerinizi içeren .kml dosyanızı yükleyin.",
  },
  {
    title: "Siparişinizi oluşturun",
    description: "Kredinizden gerekli tutar düşülür ve işleminiz başlatılır.",
  },
  {
    title: "Sonuçlarınızı alın",
    description: "İşlem tamamlandığında yükseklik verilerinizi CSV olarak indirin.",
  },
];

const trustPoints = [
  "Güvenli dosya saklama",
  "Kredi tabanlı sipariş akışı",
  "CSV dışa aktarma",
];

const contourPaths = [
  "M 24 152 C 84 120, 150 112, 220 130 C 298 151, 343 101, 408 91 C 502 76, 584 109, 664 86 C 713 72, 759 50, 784 42",
  "M 14 206 C 80 176, 148 170, 218 186 C 299 205, 340 155, 408 145 C 505 129, 577 165, 650 144 C 704 128, 753 104, 786 96",
  "M 8 266 C 88 242, 142 240, 215 255 C 299 272, 350 221, 417 210 C 500 197, 578 229, 655 212 C 706 201, 750 178, 792 171",
  "M 0 328 C 72 309, 144 305, 220 318 C 301 333, 349 285, 419 274 C 508 259, 584 292, 657 278 C 708 268, 750 249, 800 242",
  "M 6 388 C 78 372, 149 370, 224 379 C 302 389, 355 353, 416 346 C 496 337, 579 362, 653 352 C 709 344, 748 329, 794 323",
  "M 16 448 C 90 433, 157 434, 225 441 C 304 449, 351 419, 416 411 C 492 402, 572 421, 650 415 C 705 410, 753 396, 787 389",
];

function TopographyVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#06111f] p-4 shadow-[0_28px_80px_rgba(2,6,23,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.18),_transparent_32%),linear-gradient(180deg,_rgba(2,6,23,0.12),_rgba(2,6,23,0.82))]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="absolute left-8 top-8 rounded-full border border-cyan-300/20 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
        Elevation map
      </div>
      <div className="absolute right-8 top-8 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
        Topographic layers
      </div>

      <svg
        viewBox="0 0 800 560"
        className="relative z-10 h-[22rem] w-full sm:h-[28rem]"
        role="img"
        aria-label="Stilize topografik elevation haritası"
      >
        <defs>
          <linearGradient id="terrain-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.34)" />
            <stop offset="52%" stopColor="rgba(15,23,42,0.8)" />
            <stop offset="100%" stopColor="rgba(8,15,26,0.98)" />
          </linearGradient>
          <radialGradient id="terrain-glow" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="rgba(125,211,252,0.3)" />
            <stop offset="45%" stopColor="rgba(14,165,233,0.1)" />
            <stop offset="100%" stopColor="rgba(2,6,23,0)" />
          </radialGradient>
        </defs>

        <rect width="800" height="560" rx="36" fill="rgba(2,6,23,0.2)" />
        <rect x="48" y="54" width="704" height="438" rx="30" fill="url(#terrain-glow)" opacity="0.8" />
        <path
          d="M 0 474 C 78 430, 146 418, 220 390 C 293 363, 347 300, 410 292 C 489 281, 541 332, 616 317 C 681 303, 726 250, 800 228 L 800 560 L 0 560 Z"
          fill="url(#terrain-fill)"
          opacity="0.92"
        />
        <g fill="none" strokeLinecap="round">
          {contourPaths.map((path, index) => (
            <path
              key={path}
              d={path}
              stroke={`rgba(226,232,240,${0.2 - index * 0.015})`}
              strokeWidth={index % 2 === 0 ? 1.5 : 1}
            />
          ))}
          <path
            d="M 52 432 C 120 388, 181 378, 241 351 C 314 319, 358 256, 419 245 C 497 232, 548 279, 611 268 C 673 257, 719 214, 748 196"
            stroke="rgba(125,211,252,0.35)"
            strokeWidth="2"
          />
          <path
            d="M 78 490 C 154 451, 207 440, 270 414 C 343 384, 379 337, 444 328 C 520 317, 571 352, 635 339 C 695 327, 738 286, 775 268"
            stroke="rgba(251,191,36,0.2)"
            strokeWidth="1.5"
          />
        </g>
        <g opacity="0.45">
          <circle cx="176" cy="172" r="4" fill="#7dd3fc" />
          <circle cx="322" cy="146" r="3" fill="#7dd3fc" />
          <circle cx="515" cy="184" r="3" fill="#7dd3fc" />
          <circle cx="634" cy="140" r="4" fill="#7dd3fc" />
        </g>
      </svg>

      <div className="relative z-10 grid gap-3 border-t border-white/10 bg-[#06111f]/70 p-4 backdrop-blur sm:grid-cols-3">
        {[
          { label: "Kontur yoğunluğu", value: "Yumuşak" },
          { label: "Katmanlar", value: "Teknik" },
          { label: "Çıktı", value: "CSV" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),_transparent_30%),linear-gradient(180deg,_#07111f_0%,_#091624_48%,_#050b14_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_58%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
                ATO Elevation
              </p>
              <p className="mt-1 text-sm text-slate-300">
                KML dosyalarından hassas yükseklik çıktıları
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                Paneli Aç
              </Button>
            </Link>
            <Link href="/register">
              <Button>
                KML Yükle
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="space-y-20 py-10 sm:py-14 lg:py-16">
          <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                <Layers3 className="size-3.5" />
                Teknik elevation iş akışı
              </div>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                ATO Elevation
              </h1>
              <p className="mt-5 text-2xl font-medium tracking-tight text-slate-100 sm:text-3xl">
                KML dosyalarınızdan hassas yükseklik verileri
              </p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                KML dosyanızı yükleyin, kredi bakiyenizle siparişinizi oluşturun ve koordinatlarınıza ait yükseklik verilerini kolayca alın.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    KML Yükle
                    <UploadCloud className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 sm:w-auto">
                    Paneli Aç
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {trustPoints.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                  >
                    <CheckCircle2 className="size-4 text-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <TopographyVisual />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Güvenli dosya yönetimi",
                text: "Yüklediğiniz KML dosyaları ve oluşturulan sonuç dosyaları hesabınız üzerinden güvenli şekilde saklanır. Siparişlerinizi ve kredi bakiyenizi panelinizden takip edebilirsiniz.",
                icon: <ShieldCheck className="size-5" />,
              },
              {
                title: "Sonuçlarınızı kolayca indirin",
                text: "Tamamlanan siparişlerinizde oluşturulan yükseklik verilerini CSV formatında indirebilir ve Excel veya diğer analiz programlarında kullanabilirsiniz.",
                icon: <Download className="size-5" />,
              },
              {
                title: "Teknik ve premium görünüm",
                text: "Sade arayüz, yüksek okunabilirlik ve topografik detaylar birlikte çalışır; gereksiz görsel karmaşa olmadan güçlü bir marka dili sunar.",
                icon: <Sparkles className="size-5" />,
              },
            ].map((item) => (
              <Card key={item.title} className="border-white/10 bg-white/5 p-6 shadow-none">
                <div className="grid size-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                  {item.icon}
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr]">
            <Card className="border-white/10 bg-white/5 p-6 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Nasıl çalışır?
              </p>
              <div className="mt-6 space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cyan-400/15 text-sm font-semibold text-cyan-100">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-slate-300">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                    Kredi paketleri
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Mevcut paketler</h2>
                </div>
                <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-200">
                  Paneli aç
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {CREDIT_PACKAGES.map((amount) => {
                  const isPopular = amount === 500;

                  return (
                    <div
                      key={amount}
                      className={`relative rounded-[1.75rem] border p-5 ${
                        isPopular
                          ? "border-cyan-300/30 bg-cyan-400/10"
                          : "border-white/10 bg-slate-950/40"
                      }`}
                    >
                      {isPopular ? (
                        <span className="absolute right-4 top-4 rounded-full bg-cyan-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-950">
                          Popüler
                        </span>
                      ) : null}
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Kredi paketi
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(amount)}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        Hesap bakiyenize {amount} kredi ekler.
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card className="border-white/10 bg-white/5 p-6 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Güven
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">KML dosyalarınız güvende</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Yüklenen dosyalar, sipariş kayıtları ve oluşturulan çıktı dosyaları hesabınız üzerinden düzenli şekilde saklanır. Sipariş akışı, kredi bakiyesi ve sonuç dosyaları tek panelde takip edilir.
              </p>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Sonuç
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">CSV çıktıları kolay erişilir</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Tamamlanan siparişlerinizin yükseklik verilerini CSV olarak indirip analiz araçlarında doğrudan kullanabilirsiniz.
              </p>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
