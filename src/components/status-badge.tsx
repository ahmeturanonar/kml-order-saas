import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  getElevationResolutionLabel,
  normalizeElevationResolution,
} from "@/lib/elevation-resolution";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Bekliyor",
    DOWNLOADED: "Indirildi",
    PROCESSING: "Isleniyor",
    COMPLETED: "Tamamlandi",
    CANCELLED: "Iptal edildi",
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
    SUCCEEDED: "Basarili",
    FAILED: "Basarisiz",
    CANCELLED: "Iptal edildi",
    REFUNDED: "Iade edildi",
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

export function ElevationResolutionBadge({
  resolution,
}: {
  resolution: string | null | undefined;
}) {
  const normalized = normalizeElevationResolution(resolution);

  return (
    <Badge variant={normalized === "30m" ? "info" : "neutral"}>
      {getElevationResolutionLabel(normalized)}
    </Badge>
  );
}
