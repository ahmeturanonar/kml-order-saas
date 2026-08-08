import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getKmlPrice } from "@/lib/settings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BuyCreditsCard } from "@/components/dashboard/buy-credits-card";
import { CouponRedemptionCard } from "@/components/dashboard/coupon-redemption-card";
import { OrderList } from "@/components/dashboard/order-list";
import { UploadForm } from "@/components/dashboard/upload-form";
import { StatCard } from "@/components/stat-card";
import { PaymentStatusBadge } from "@/components/status-badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUser();
  const kmlPrice = await getKmlPrice();

  const [user, recentOrders, recentPayments] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        creditBalance: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        generatedFile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Mevcut kredi"
          value={formatCurrency(user.creditBalance)}
          description="Yeni KML yuklemeleri icin kullanilabilir bakiye."
        />
        <StatCard
          title="KML fiyati"
          value={formatCurrency(kmlPrice)}
          description="Yuklenen her dosya icin otomatik olarak tahsil edilir."
        />
        <StatCard
          title="Toplam siparis"
          value={String(user._count.orders)}
          description="Yuklediginiz KML dosyalarindan olusturulan siparisler."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <UploadForm creditBalance={user.creditBalance} price={kmlPrice} />
        <div className="space-y-6">
          <BuyCreditsCard />
          <CouponRedemptionCard />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <CardTitle>Son siparisler</CardTitle>
            <CardDescription>Son yuklediginiz KML dosyalari ve durumlari.</CardDescription>
          </div>
          <OrderList orders={recentOrders} />
        </Card>

        <Card>
          <div className="mb-4">
            <CardTitle>Son odemeler</CardTitle>
            <CardDescription>Hesabinizdan yapilan son Stripe kredi satin alimlari.</CardDescription>
          </div>
          <Table className="min-w-[32rem]">
            <THead>
              <TR>
                <TH>Paket</TH>
                <TH>Tarih</TH>
                <TH>Durum</TH>
                <TH>Tutar</TH>
              </TR>
            </THead>
            <TBody>
              {recentPayments.map((payment) => (
                <TR key={payment.id}>
                  <TD>{payment.packageName}</TD>
                  <TD>{formatDate(payment.createdAt)}</TD>
                  <TD>
                    <PaymentStatusBadge status={payment.status} />
                  </TD>
                  <TD>{formatCurrency(payment.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
