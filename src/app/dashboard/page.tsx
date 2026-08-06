import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getKmlPrice } from "@/lib/settings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BuyCreditsCard } from "@/components/dashboard/buy-credits-card";
import { UploadForm } from "@/components/dashboard/upload-form";
import { StatCard } from "@/components/stat-card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
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
          description="Yeni KML yüklemeleri için kullanılabilir bakiye."
        />
        <StatCard
          title="KML fiyatı"
          value={formatCurrency(kmlPrice)}
          description="Yüklenen her dosya için otomatik olarak tahsil edilir."
        />
        <StatCard
          title="Toplam sipariş"
          value={String(user._count.orders)}
          description="Yüklediğiniz KML dosyalarından oluşturulan siparişler."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <UploadForm creditBalance={user.creditBalance} price={kmlPrice} />
        <BuyCreditsCard />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <CardTitle>Son siparişler</CardTitle>
            <CardDescription>Son yüklediğiniz KML dosyaları ve durumları.</CardDescription>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Sipariş</TH>
                <TH>Tarih</TH>
                <TH>Durum</TH>
                <TH>Harcanan</TH>
              </TR>
            </THead>
            <TBody>
              {recentOrders.map((order) => (
                <TR key={order.id}>
                  <TD>{order.orderNumber}</TD>
                  <TD>{formatDate(order.createdAt)}</TD>
                  <TD>
                    <OrderStatusBadge status={order.status} />
                  </TD>
                  <TD>{formatCurrency(order.creditCharged)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <div className="mb-4">
            <CardTitle>Son ödemeler</CardTitle>
            <CardDescription>Hesabınızdan yapılan son Stripe kredi satın alımları.</CardDescription>
          </div>
          <Table>
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
                  <TD><PaymentStatusBadge status={payment.status} /></TD>
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
