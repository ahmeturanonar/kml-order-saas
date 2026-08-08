import { CouponCreateForm } from "@/components/admin/coupon-create-form";
import { CouponStatusButton } from "@/components/admin/coupon-status-button";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    include: {
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { code: "asc" }],
  });

  const totalRedemptions = coupons.reduce((sum, coupon) => sum + coupon._count.redemptions, 0);
  const activeCoupons = coupons.filter((coupon) => coupon.isActive).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Toplam kupon" value={String(coupons.length)} description="Tanımlı tüm kupon kodları." />
        <StatCard title="Aktif kupon" value={String(activeCoupons)} description="Şu anda kullanılabilir kuponlar." />
        <StatCard title="Toplam kullanım" value={String(totalRedemptions)} description="Tüm kupon kullanımları." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-5">
          <div>
            <CardTitle>Kupon Oluştur</CardTitle>
            <CardDescription>Kod, kredi miktarı ve aktif durumunu belirleyin.</CardDescription>
          </div>
          <CouponCreateForm />
        </Card>

        <Card className="space-y-5">
          <div>
            <CardTitle>Kuponlar</CardTitle>
            <CardDescription>Oluşturduğunuz kuponları görün, kullanım sayılarını takip edin ve durumlarını yönetin.</CardDescription>
          </div>

          <Table className="min-w-[52rem]">
            <THead>
              <TR>
                <TH>Kod</TH>
                <TH>Kredi</TH>
                <TH>Kullanım sayısı</TH>
                <TH>Durum</TH>
                <TH>Oluşturulma tarihi</TH>
                <TH>İşlemler</TH>
              </TR>
            </THead>
            <TBody>
              {coupons.map((coupon) => (
                <TR key={coupon.id}>
                  <TD className="font-semibold text-slate-950 dark:text-white">{coupon.code}</TD>
                  <TD>{coupon.creditAmount} kredi</TD>
                  <TD>{coupon._count.redemptions}</TD>
                  <TD>
                    <Badge variant={coupon.isActive ? "success" : "warning"}>
                      {coupon.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TD>
                  <TD>{formatDate(coupon.createdAt)}</TD>
                  <TD>
                    <CouponStatusButton couponId={coupon.id} isActive={coupon.isActive} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
