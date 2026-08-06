import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status === UserStatus.DISABLED) {
    redirect("/login?error=disabled");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  return session;
}
