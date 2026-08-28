import { LoginForm } from "@/components/auth-forms";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { invite?: string; email?: string };
}) {
  const user = await getSessionUser();
  if (user && !searchParams.invite) redirect(homeForRole(user.role));
  return <LoginForm inviteToken={searchParams.invite} email={searchParams.email} />;
}
