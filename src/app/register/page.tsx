import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="grid min-h-screen place-items-center px-6 py-16">
      <RegisterForm />
    </div>
  );
}
