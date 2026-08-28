import { RegisterForm } from "@/components/auth-forms";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { invite?: string; role?: string };
}) {
  const user = await getSessionUser();
  if (user && !searchParams.invite) redirect(homeForRole(user.role));
  let email: string | undefined;
  if (searchParams.invite) {
    const invite = await prisma.invite.findUnique({ where: { token: searchParams.invite } });
    email = invite?.email;
  }
  const role = searchParams.role === "INVESTOR" ? "INVESTOR" : "FOUNDER";
  return <RegisterForm inviteToken={searchParams.invite} email={email} role={role} />;
}
