import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard/orders");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10 sm:px-6 sm:py-16">
      <LoginForm />
    </div>
  );
}
