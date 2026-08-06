import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardCreditsPage() {
  const session = await requireUser();
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId: session.user.id },
    include: {
      sourceUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-4">
        <CardTitle>Kredi geçmişim</CardTitle>
        <CardDescription>Tüm kredi satın alımları, yükleme ücretleri, iadeler ve yönetici düzeltmeleri.</CardDescription>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Tarih</TH>
            <TH>Tutar</TH>
            <TH>Sonraki bakiye</TH>
            <TH>Neden</TH>
            <TH>Kaynak</TH>
          </TR>
        </THead>
        <TBody>
          {transactions.map((transaction) => (
            <TR key={transaction.id}>
              <TD>{formatDate(transaction.createdAt)}</TD>
              <TD className={transaction.amount >= 0 ? "text-emerald-600" : "text-rose-500"}>
                {transaction.amount >= 0 ? "+" : ""}
                {formatCurrency(transaction.amount)}
              </TD>
              <TD>{formatCurrency(transaction.balanceAfter)}</TD>
              <TD>{transaction.description}</TD>
              <TD>
                {transaction.sourceUser
                  ? `${transaction.sourceUser.name ?? transaction.sourceUser.email} (${transaction.sourceType})`
                  : transaction.sourceType}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
