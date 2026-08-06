import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-4">
        <CardTitle>Ödeme geçmişi</CardTitle>
        <CardDescription>Tüm Stripe kredi satın alımları ve durumları.</CardDescription>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Müşteri</TH>
            <TH>Paket</TH>
            <TH>Tutar</TH>
            <TH>Tarih</TH>
            <TH>Durum</TH>
          </TR>
        </THead>
        <TBody>
          {payments.map((payment) => (
            <TR key={payment.id}>
              <TD>
                <div className="space-y-1">
                  <p>{payment.user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{payment.user.email}</p>
                </div>
              </TD>
              <TD>{payment.packageName}</TD>
              <TD>{formatCurrency(payment.amount)}</TD>
              <TD>{formatDate(payment.createdAt)}</TD>
              <TD>
                <PaymentStatusBadge status={payment.status} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
