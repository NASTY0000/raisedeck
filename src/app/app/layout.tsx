import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "FOUNDER") redirect("/invest");
  return (
    <AppShell
      user={user}
      nav={[
        { href: "/app", label: "Overview" },
        { href: "/app/raises", label: "Raises" },
        { href: "/app/company", label: "Company" },
      ]}
    >
      {children}
    </AppShell>
  );
}
