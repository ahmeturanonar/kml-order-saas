"use client";

import { OrderStatus } from "@prisma/client";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function OrderStatusForm({
  orderId,
  currentStatus,
  compact = false,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await updateOrderStatusAction(formData);
            toast.success("Sipariş durumu güncellendi.");
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Durum güncellemesi başarısız oldu.");
          }
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue={currentStatus}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        >
          {Object.values(OrderStatus).map((status) => (
            <option key={status} value={status}>
              {{ PENDING: "Bekliyor", DOWNLOADED: "İndirildi", PROCESSING: "İşleniyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal edildi" }[status]}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Güncelle"}
        </Button>
      </div>
      {!compact ? (
        <textarea
          name="note"
          placeholder="İsteğe bağlı dahili not"
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        />
      ) : null}
    </form>
  );
}
