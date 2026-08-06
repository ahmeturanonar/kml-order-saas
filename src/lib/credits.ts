import { CreditSource, CreditTransactionType, Prisma, PrismaClient } from "@prisma/client";

type CreditClient = Prisma.TransactionClient | PrismaClient;

export async function createCreditTransaction(
  tx: CreditClient,
  params: {
    userId: string;
    amount: number;
    type: CreditTransactionType;
    description: string;
    balanceAfter: number;
    orderId?: string;
    paymentId?: string;
    sourceType?: CreditSource;
    sourceUserId?: string;
  },
) {
  return tx.creditTransaction.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      type: params.type,
      description: params.description,
      balanceAfter: params.balanceAfter,
      orderId: params.orderId,
      paymentId: params.paymentId,
      sourceType: params.sourceType ?? CreditSource.SYSTEM,
      sourceUserId: params.sourceUserId,
    },
  });
}

export async function applyCreditTransaction(
  tx: CreditClient,
  params: {
    userId: string;
    amount: number;
    type: CreditTransactionType;
    description: string;
    orderId?: string;
    paymentId?: string;
    sourceType?: CreditSource;
    sourceUserId?: string;
  },
) {
  const user = await tx.user.update({
    where: { id: params.userId },
    data: {
      creditBalance: {
        increment: params.amount,
      },
    },
    select: {
      id: true,
      creditBalance: true,
    },
  });

  const transaction = await createCreditTransaction(tx, {
    ...params,
    balanceAfter: user.creditBalance,
  });

  return {
    user,
    transaction,
  };
}
