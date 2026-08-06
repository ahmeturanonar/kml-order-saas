import { UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CreditAdjustForm } from "@/components/admin/credit-adjust-form";
import { UserEditForm } from "@/components/admin/user-edit-form";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  page?: string;
}>;

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const where = {
    role: "CUSTOMER" as const,
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" as const } },
            { email: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4">
        <CardTitle>Kullanıcı ara</CardTitle>
        <CardDescription>Müşterileri ad veya e-posta ile bulun, ardından bakiyelerini ve durumlarını yönetin.</CardDescription>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={params.q}
          placeholder="Müşteri adı veya e-posta"
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-950"
          />
        <button className="rounded-xl bg-cyan-500 px-4 font-semibold text-slate-950">Ara</button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
        <CardTitle>Müşteriler</CardTitle>
        <CardDescription>Kredi bakiyeleri, sipariş toplamları, durum ve yönetim işlemleri.</CardDescription>
          </div>
          <Badge variant="info">{totalUsers} kullanıcı</Badge>
        </div>

        <Table>
          <THead>
            <TR>
            <TH>Ad</TH>
            <TH>E-posta</TH>
            <TH>Mevcut kredi</TH>
            <TH>Toplam sipariş</TH>
            <TH>Kayıt tarihi</TH>
            <TH>Durum</TH>
            <TH>İşlemler</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((user) => (
              <TR key={user.id}>
                <TD>{user.name}</TD>
                <TD>{user.email}</TD>
                <TD>{formatCurrency(user.creditBalance)}</TD>
                <TD>{user._count.orders}</TD>
                <TD>{formatDate(user.createdAt)}</TD>
                <TD>
                  <Badge variant={user.status === UserStatus.ACTIVE ? "success" : "warning"}>
                    {user.status === UserStatus.ACTIVE ? "Etkin" : "Devre dışı"}
                  </Badge>
                </TD>
                <TD>
                  <div className="space-y-3">
                    <UserEditForm userId={user.id} name={user.name} email={user.email} />
                    <CreditAdjustForm userId={user.id} mode="add" />
                    <CreditAdjustForm userId={user.id} mode="remove" />
                    <UserStatusToggle userId={user.id} currentStatus={user.status} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={`?q=${encodeURIComponent(params.q ?? "")}&page=${page - 1}`}
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
              >
                Previous
              </a>
            ) : null}
            {page < totalPages ? (
              <a
                href={`?q=${encodeURIComponent(params.q ?? "")}&page=${page + 1}`}
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
              >
                Next
              </a>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
