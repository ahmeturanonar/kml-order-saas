import { OrderStatus } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ElevationResolutionBadge,
  OrderStatusBadge,
} from "@/components/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type OrderListItem = {
  id: string;
  orderNumber: string;
  createdAt: Date | string;
  status: OrderStatus;
  resolution?: string | null;
  creditCharged: number;
  remainingBalanceAfter?: number | null;
  uploadedFile?: {
    originalFileName: string | null;
  } | null;
  generatedFile?: {
    id?: string;
  } | null;
};

type OrderListProps = {
  orders: OrderListItem[];
  variant?: "compact" | "full";
  emptyMessage?: string;
};

const actionClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:min-h-9 sm:w-auto sm:py-0 sm:text-xs";

function CsvAction({
  orderId,
  hasGeneratedFile,
}: {
  orderId: string;
  hasGeneratedFile: boolean;
}) {
  if (hasGeneratedFile) {
    return (
      <a href={`/api/orders/${orderId}/csv`} className={actionClassName}>
        CSV indir
      </a>
    );
  }

  return (
    <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:min-h-9 sm:w-auto sm:py-0 sm:text-xs">
      Hazir degil
    </span>
  );
}

function DetailItem({
  label,
  value,
  breakValue = false,
}: {
  label: string;
  value: string;
  breakValue?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-900/70">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={
          breakValue
            ? "mt-1 break-all text-sm text-slate-900 dark:text-slate-100"
            : "mt-1 text-sm text-slate-900 dark:text-slate-100"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ResolutionDetail({ resolution }: { resolution?: string | null }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-900/70">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Cozunurluk
      </dt>
      <dd className="mt-2">
        <ElevationResolutionBadge resolution={resolution} />
      </dd>
    </div>
  );
}

export function OrderList({
  orders,
  variant = "compact",
  emptyMessage = "Henuz siparis bulunmuyor.",
}: OrderListProps) {
  const isFull = variant === "full";

  if (orders.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="hidden md:block">
        <Table className={isFull ? "min-w-[76rem]" : "min-w-[48rem]"}>
          <THead>
            <TR>
              <TH>Siparis</TH>
              {isFull ? <TH>Dosya adi</TH> : null}
              <TH>{isFull ? "Yuklenme tarihi" : "Tarih"}</TH>
              <TH>Cozunurluk</TH>
              <TH>Durum</TH>
              <TH>Harcanan</TH>
              {isFull ? <TH>Kalan bakiye</TH> : null}
              <TH>CSV</TH>
            </TR>
          </THead>
          <TBody>
            {orders.map((order) => (
              <TR key={order.id}>
                <TD>{order.orderNumber}</TD>
                {isFull ? (
                  <TD className="max-w-xs break-all">
                    {order.uploadedFile?.originalFileName ?? "-"}
                  </TD>
                ) : null}
                <TD>{formatDate(order.createdAt)}</TD>
                <TD>
                  <ElevationResolutionBadge resolution={order.resolution} />
                </TD>
                <TD>
                  <OrderStatusBadge status={order.status} />
                </TD>
                <TD>{formatCurrency(order.creditCharged)}</TD>
                {isFull ? (
                  <TD>{formatCurrency(order.remainingBalanceAfter ?? 0)}</TD>
                ) : null}
                <TD>
                  <CsvAction
                    orderId={order.id}
                    hasGeneratedFile={Boolean(order.generatedFile)}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <article
            key={order.id}
            className="min-w-0 rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-4 shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-black/20"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-600">
                    Siparis
                  </p>
                  <p className="mt-1 break-all text-base font-semibold text-slate-950 dark:text-white">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="shrink-0">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <dl className="grid gap-3">
                {isFull ? (
                  <DetailItem
                    label="Dosya adi"
                    value={order.uploadedFile?.originalFileName ?? "-"}
                    breakValue
                  />
                ) : null}
                <DetailItem
                  label={isFull ? "Yuklenme tarihi" : "Tarih"}
                  value={formatDate(order.createdAt)}
                />
                <ResolutionDetail resolution={order.resolution} />
                <DetailItem label="Harcanan kredi" value={formatCurrency(order.creditCharged)} />
                {isFull ? (
                  <DetailItem
                    label="Kalan bakiye"
                    value={formatCurrency(order.remainingBalanceAfter ?? 0)}
                  />
                ) : null}
              </dl>

              <div className="pt-1">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  CSV
                </p>
                <CsvAction
                  orderId={order.id}
                  hasGeneratedFile={Boolean(order.generatedFile)}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
