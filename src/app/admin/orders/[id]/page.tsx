import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteUploadForm } from "@/components/admin/delete-upload-form";
import { OrderNoteForm } from "@/components/admin/order-note-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      uploadedFile: true,
      statusHistory: {
        include: {
          changedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      notes: {
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sipariş ayrıntısı</p>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{order.orderNumber}</h2>
        </div>
        <Link href="/admin/orders" className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">
          Siparişlere dön
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div>
            <CardTitle>Sipariş özeti</CardTitle>
            <CardDescription>Müşteri, dosya, durum, zamanlama ve kredi ayrıntıları.</CardDescription>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Müşteri</p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-white">{order.user.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{order.user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dosya adı</p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-white">{order.uploadedFile?.originalFileName ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Yüklenme tarihi</p>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Harcanan kredi</p>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{formatCurrency(order.creditCharged)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mevcut durum</p>
              <div className="mt-2">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kalan bakiye</p>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{formatCurrency(order.remainingBalanceAfter)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/api/admin/orders/${order.id}/download`}
              className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
            >
              Asıl KML dosyasını indir
            </Link>
            <DeleteUploadForm orderId={order.id} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle>Yönetici işlemleri</CardTitle>
            <CardDescription>Durumu güncelleyin ve isteğe bağlı dahili açıklama ekleyin.</CardDescription>
          </div>
          <OrderStatusForm orderId={order.id} currentStatus={order.status} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <CardTitle>Durum geçmişi</CardTitle>
            <CardDescription>Tarih ve işlemi yapan kişiyle birlikte tüm sipariş durumu geçişleri.</CardDescription>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Tarih</TH>
                <TH>Önceki</TH>
                <TH>Yeni</TH>
                <TH>İşlemi yapan</TH>
              </TR>
            </THead>
            <TBody>
              {order.statusHistory.map((entry) => (
                <TR key={entry.id}>
                  <TD>{formatDate(entry.createdAt)}</TD>
                  <TD>{entry.fromStatus ? { PENDING: "Bekliyor", DOWNLOADED: "İndirildi", PROCESSING: "İşleniyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal edildi" }[entry.fromStatus] : "-"}</TD>
                  <TD>
                    <Badge variant="info">{{ PENDING: "Bekliyor", DOWNLOADED: "İndirildi", PROCESSING: "İşleniyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal edildi" }[entry.toStatus]}</Badge>
                  </TD>
                  <TD>{entry.changedBy?.name ?? entry.changedBy?.email ?? "Sistem"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle>Dahili notlar</CardTitle>
            <CardDescription>Yalnızca yöneticiler tarafından görülebilir.</CardDescription>
          </div>

          <OrderNoteForm orderId={order.id} />

          <div className="space-y-3">
            {order.notes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {note.author?.name ?? note.author?.email ?? "Yönetici"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(note.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{note.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
