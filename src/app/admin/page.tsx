import { subDays } from "date-fns";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function buildDailySeries() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = subDays(new Date(), 6 - index);
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
      orders: 0,
      revenue: 0,
    };
  });
}

export default async function AdminPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalOrders,
    pendingOrders,
    completedOrders,
    todayOrders,
    totalRevenue,
    totalCreditsSold,
    recentOrders,
    recentSucceededPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.aggregate({
      where: { type: "PURCHASE" },
      _sum: { amount: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: subDays(new Date(), 6) } },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "SUCCEEDED",
        createdAt: { gte: subDays(new Date(), 6) },
      },
      select: {
        createdAt: true,
        amount: true,
      },
    }),
  ]);

  const todayRevenue = recentSucceededPayments
    .filter((payment) => payment.createdAt >= startOfToday)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const chartSeries = buildDailySeries();
  for (const order of recentOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const day = chartSeries.find((entry) => entry.key === key);
    if (day) {
      day.orders += 1;
    }
  }
  for (const payment of recentSucceededPayments) {
    const key = payment.createdAt.toISOString().slice(0, 10);
    const day = chartSeries.find((entry) => entry.key === key);
    if (day) {
      day.revenue += payment.amount;
    }
  }
  const maxOrders = Math.max(...chartSeries.map((item) => item.orders), 1);
  const maxRevenue = Math.max(...chartSeries.map((item) => item.revenue), 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Toplam kullanıcı" value={String(totalUsers)} description="Kayıtlı müşteri hesapları." />
        <StatCard title="Toplam sipariş" value={String(totalOrders)} description="Sisteme yüklenen tüm KML siparişleri." />
        <StatCard title="Bekleyen siparişler" value={String(pendingOrders)} description="Manuel işlemeyi bekleyen siparişler." />
        <StatCard title="Tamamlanan siparişler" value={String(completedOrders)} description="Tamamlandı olarak işaretlenen siparişler." />
        <StatCard title="Bugünkü siparişler" value={String(todayOrders)} description="Gece yarısından bu yana oluşturulan siparişler." />
        <StatCard title="Bugünkü gelir" value={formatCurrency(todayRevenue)} description="Bugünkü başarılı Stripe ödemeleri." />
        <StatCard title="Toplam gelir" value={formatCurrency(totalRevenue._sum.amount ?? 0)} description="Tüm başarılı Stripe ödemeleri." />
        <StatCard title="Satılan toplam kredi" value={formatCurrency(totalCreditsSold._sum.amount ?? 0)} description="Satın alımlarla eklenen krediler." />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <CardTitle>Günlük siparişler</CardTitle>
              <CardDescription>Son 7 gündeki yükleme etkinliği.</CardDescription>
            </div>
            <Badge variant="info">7 günlük görünüm</Badge>
          </div>
          <div className="flex h-64 items-end gap-3">
            {chartSeries.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end rounded-2xl bg-slate-100 p-2 dark:bg-slate-900">
                  <div
                    className="w-full rounded-xl bg-cyan-500"
                    style={{ height: `${Math.max(10, (item.orders / maxOrders) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.orders}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <CardTitle>Günlük gelir</CardTitle>
              <CardDescription>Son 7 gündeki başarılı Stripe ödemeleri.</CardDescription>
            </div>
            <Badge variant="success">{formatCurrency(totalRevenue._sum.amount ?? 0)}</Badge>
          </div>
          <div className="flex h-64 items-end gap-3">
            {chartSeries.map((item) => (
              <div key={`${item.key}-revenue`} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end rounded-2xl bg-slate-100 p-2 dark:bg-slate-900">
                  <div
                    className="w-full rounded-xl bg-emerald-500"
                    style={{ height: `${Math.max(10, (item.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(item.revenue)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
