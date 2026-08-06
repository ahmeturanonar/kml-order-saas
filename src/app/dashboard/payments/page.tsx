import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/status-badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPaymentsPage() {
  const session = await requireUser();
  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-4">
        <CardTitle>Ödeme geçmişi</CardTitle>
        <CardDescription>Hesabınıza kredi ekleyen Stripe ödemeleri.</CardDescription>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Paket</TH>
            <TH>Tutar</TH>
            <TH>Tarih</TH>
            <TH>Durum</TH>
            <TH>Makbuz</TH>
          </TR>
        </THead>
        <TBody>
          {payments.map((payment) => (
            <TR key={payment.id}>
              <TD>{payment.packageName}</TD>
              <TD>{formatCurrency(payment.amount)}</TD>
              <TD>{formatDate(payment.createdAt)}</TD>
              <TD>
                <PaymentStatusBadge status={payment.status} />
              </TD>
              <TD>
                {payment.receiptUrl ? (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-300"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
