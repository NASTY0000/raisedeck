import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function InvestLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "FOUNDER") redirect("/app");
  return (
    <AppShell
      user={user}
      nav={[
        { href: "/invest", label: "Dealflow" },
      ]}
    >
      {children}
    </AppShell>
  );
}
