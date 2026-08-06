import { Prisma, PrismaClient } from "@prisma/client";

type AuditClient = Prisma.TransactionClient | PrismaClient;

export async function recordAuditLog(
  client: AuditClient,
  params: {
    actorUserId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    targetLabel: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return client.auditLog.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      targetLabel: params.targetLabel,
      metadata: params.metadata,
    },
  });
}
