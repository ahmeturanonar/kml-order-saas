import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      actor: {
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
        <CardTitle>Denetim günlüğü</CardTitle>
        <CardDescription>Yönetici girişleri, kredi ve durum değişiklikleri, ayar güncellemeleri ve silme işlemleri.</CardDescription>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Zaman</TH>
            <TH>Kişi</TH>
            <TH>İşlem</TH>
            <TH>Hedef</TH>
          </TR>
        </THead>
        <TBody>
          {logs.map((log) => (
            <TR key={log.id}>
              <TD>{formatDate(log.createdAt)}</TD>
              <TD>{log.actor?.name ?? log.actor?.email ?? "Sistem"}</TD>
              <TD>{log.action}</TD>
              <TD>
                <div className="space-y-1">
                  <p>{log.targetLabel}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{log.targetType}</p>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
