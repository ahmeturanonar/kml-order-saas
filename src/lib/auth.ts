import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role, UserStatus } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { getNextAuthSecret } from "@/lib/env";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: getNextAuthSecret(),
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        if (user.status === UserStatus.DISABLED) {
          return null;
        }

        const passwordMatches = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          creditBalance: user.creditBalance,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.creditBalance = user.creditBalance;
        token.status = user.status;
      }

      if (trigger === "update" && session?.user) {
        token.role = session.user.role;
        token.creditBalance = session.user.creditBalance;
        token.status = session.user.status;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            creditBalance: true,
            status: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.creditBalance = dbUser.creditBalance;
          token.status = dbUser.status;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role | undefined) ?? Role.CUSTOMER;
        session.user.creditBalance = Number(token.creditBalance ?? 0);
        session.user.status = (token.status as UserStatus | undefined) ?? UserStatus.ACTIVE;
      }

      return session;
    },
    async signIn({ user }) {
      if (!user.email || user.status === UserStatus.DISABLED) {
        return false;
      }

      if (user.role === Role.ADMIN) {
        await recordAuditLog(prisma, {
          actorUserId: user.id,
          action: "ADMIN_LOGIN",
          targetType: "AUTH",
          targetId: user.id,
          targetLabel: user.email,
        });
      }

      return true;
    },
  },
};
