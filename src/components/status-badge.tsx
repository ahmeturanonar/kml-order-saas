import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Bekliyor",
    DOWNLOADED: "İndirildi",
    PROCESSING: "İşleniyor",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal edildi",
  };
  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "DOWNLOADED"
        ? "info"
      : status === "PROCESSING"
        ? "info"
        : status === "CANCELLED"
          ? "danger"
          : "warning";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const labels: Record<PaymentStatus, string> = {
    PENDING: "Bekliyor",
    SUCCEEDED: "Başarılı",
    FAILED: "Başarısız",
    CANCELLED: "İptal edildi",
    REFUNDED: "İade edildi",
  };
  const variant =
    status === "SUCCEEDED"
      ? "success"
      : status === "CANCELLED"
        ? "warning"
        : status === "FAILED"
          ? "danger"
          : "neutral";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}
