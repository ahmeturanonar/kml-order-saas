import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCreditsPage() {
  const transactions = await prisma.creditTransaction.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
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
        <CardTitle>Kredi geçmişi</CardTitle>
        <CardDescription>Platformdaki tüm satın alımlar, yükleme ücretleri, iadeler ve yönetici düzeltmeleri.</CardDescription>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Tarih</TH>
            <TH>Kullanıcı</TH>
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
              <TD>
                <div className="space-y-1">
                  <p>{transaction.user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.user.email}</p>
                </div>
              </TD>
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
