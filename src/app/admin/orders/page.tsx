import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { DeleteUploadForm } from "@/components/admin/delete-upload-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

const FILTERS = [
  { label: "Tümü", value: "" },
  { label: "Bekliyor", value: OrderStatus.PENDING },
  { label: "İndirildi", value: OrderStatus.DOWNLOADED },
  { label: "İşleniyor", value: OrderStatus.PROCESSING },
  { label: "Tamamlandı", value: OrderStatus.COMPLETED },
  { label: "İptal edildi", value: OrderStatus.CANCELLED },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusFilter = Object.values(OrderStatus).includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(params.q
      ? {
          OR: [
            { orderNumber: { contains: params.q, mode: "insensitive" as const } },
            { user: { name: { contains: params.q, mode: "insensitive" as const } } },
            { uploadedFile: { originalFileName: { contains: params.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: true,
      uploadedFile: true,
      _count: {
        select: {
          notes: true,
          statusHistory: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4">
          <CardTitle>Sipariş ara</CardTitle>
          <CardDescription>Sipariş numarası, müşteri adı veya dosya adına göre arayın. İş akışı aşamasına göre filtreleyin.</CardDescription>
        </div>

        <form className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Sipariş numarası, müşteri adı, dosya adı"
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-950"
          />
          <button className="rounded-xl bg-cyan-500 px-4 font-semibold text-slate-950">Ara</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = (params.status ?? "") === filter.value;
            const href = `?q=${encodeURIComponent(params.q ?? "")}&status=${filter.value}`;

            return (
              <a
                key={filter.label}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  active
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {filter.label}
              </a>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <CardTitle>Siparişler</CardTitle>
            <CardDescription>Yüklemeleri inceleyin, iş akışı durumunu güncelleyin, notları görüntüleyin ve asıl dosyaları indirin.</CardDescription>
          </div>
          <Badge variant="info">{orders.length} sonuç</Badge>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Sipariş</TH>
              <TH>Müşteri</TH>
              <TH>Dosya adı</TH>
              <TH>Yüklenme tarihi</TH>
              <TH>Durum</TH>
              <TH>Kredi</TH>
              <TH>Ayrıntılar</TH>
              <TH>İşlemler</TH>
            </TR>
          </THead>
          <TBody>
            {orders.map((order) => (
              <TR key={order.id}>
                <TD>{order.orderNumber}</TD>
                <TD>
                  <div className="space-y-1">
                    <p>{order.user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{order.user.email}</p>
                  </div>
                </TD>
                <TD>{order.uploadedFile?.originalFileName ?? "-"}</TD>
                <TD>{formatDate(order.createdAt)}</TD>
                <TD>
                  <OrderStatusBadge status={order.status} />
                </TD>
                <TD>{formatCurrency(order.creditCharged)}</TD>
                <TD>
                  <div className="space-y-2">
                    <a href={`/admin/orders/${order.id}`} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-300">
                      Ayrıntıları görüntüle
                    </a>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {order._count.statusHistory} geçmiş kaydı, {order._count.notes} not
                    </div>
                    <Link href={`/api/admin/orders/${order.id}/download`} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-300">
                      KML indir
                    </Link>
                  </div>
                </TD>
                <TD>
                  <div className="flex flex-col gap-2">
                    <OrderStatusForm orderId={order.id} currentStatus={order.status} compact />
                    <DeleteUploadForm orderId={order.id} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
