import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, UploadCloud } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(to_bottom,_#eff6ff,_#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.14),_transparent_30%),linear-gradient(to_bottom,_#020617,_#0f172a)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex items-center justify-between rounded-[2rem] border border-slate-200/70 bg-white/85 px-6 py-4 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-600">
              Surfer KML SaaS
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              KML yüklemeleri için manuel sipariş yönetimi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">Giriş yap</Button>
            </Link>
            <Link href="/register">
              <Button>Başlayın</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-10 px-2 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
              KML dosyaları asla otomatik işlenmez
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              Kredi satın, KML siparişlerini alın ve tüm Surfer teslimatlarını tek panelden yönetin.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Müşteriler ön ödemeli kredi satın alır, KML dosyalarını yükler ve sipariş durumlarını takip eder. Siz dosyaları indirip site dışında Surfer ile manuel olarak işlerken platform onları güvenle saklar.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg">
                  Kredi ile başlayın
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Paneli aç
                </Button>
              </Link>
            </div>
          </div>

          <Card className="grid gap-4 bg-slate-950 text-white dark:bg-slate-900">
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">İş akışı</p>
              <ol className="mt-4 space-y-3 text-sm text-slate-200">
                <li>1. Müşteri Stripe ile kredi satın alır.</li>
                <li>2. Müşteri bir `.kml` dosyası yükler.</li>
                <li>3. Site dosyayı saklar ve bekleyen bir sipariş oluşturur.</li>
                <li>4. Dosyayı yönetici panelinden indirirsiniz.</li>
                <li>5. Surfer ile manuel olarak işlersiniz.</li>
                <li>6. Siparişi tamamlandı olarak işaretlersiniz.</li>
              </ol>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/8 p-5">
                <UploadCloud className="size-6 text-cyan-300" />
                <p className="mt-4 font-semibold">Doğrulanmış yüklemeler</p>
                <p className="mt-2 text-sm text-slate-300">Yalnızca `.kml`; MIME kontrolü ve 50 MB boyut sınırı.</p>
              </div>
              <div className="rounded-3xl bg-white/8 p-5">
                <CreditCard className="size-6 text-cyan-300" />
                <p className="mt-4 font-semibold">Ön ödemeli kredi modeli</p>
                <p className="mt-2 text-sm text-slate-300">Otomatik bakiye güncellemeli 100, 250, 500 ve 1000 TL paketleri.</p>
              </div>
              <div className="rounded-3xl bg-white/8 p-5">
                <ShieldCheck className="size-6 text-cyan-300" />
                <p className="mt-4 font-semibold">Yönetici kontrollü teslimat</p>
                <p className="mt-2 text-sm text-slate-300">Otomatik KML işleme yoktur; yalnızca güvenli depolama ve iş akışı takibi yapılır.</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
