import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getKmlPrice } from "@/lib/settings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/status-badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage() {
  const session = await requireUser();
  const kmlPrice = await getKmlPrice();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { uploadedFile: true, generatedFile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-4">
        <CardTitle>Sipariş geçmişi</CardTitle>
        <CardDescription>
          Her KML yüklemesi {formatCurrency(kmlPrice)} ücretli bir siparişe dönüştürülür.
        </CardDescription>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Sipariş</TH>
            <TH>Dosya adı</TH>
            <TH>Yüklenme tarihi</TH>
            <TH>Durum</TH>
            <TH>Harcanan</TH>
            <TH>Kalan bakiye</TH>
            <TH>CSV</TH>
          </TR>
        </THead>
        <TBody>
          {orders.map((order) => (
            <TR key={order.id}>
              <TD>{order.orderNumber}</TD>
              <TD>{order.uploadedFile?.originalFileName ?? "-"}</TD>
              <TD>{formatDate(order.createdAt)}</TD>
              <TD>
                <OrderStatusBadge status={order.status} />
              </TD>
              <TD>{formatCurrency(order.creditCharged)}</TD>
              <TD>{formatCurrency(order.remainingBalanceAfter)}</TD>
              <TD>
                {order.generatedFile ? (
                  <a
                    href={`/api/orders/${order.id}/csv`}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    CSV indir
                  </a>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Hazır değil</span>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
