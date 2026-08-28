import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { acceptInviteAction } from "@/lib/actions";
import { Logo } from "@/components/ui";
import { ROUND_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
    include: { raise: { include: { company: true } }, createdBy: true },
  });
  if (!invite) notFound();
  const user = await getSessionUser();
  const expired = Boolean(invite.expiresAt && invite.expiresAt < new Date());

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Link href="/">
          <Logo />
        </Link>
        <div className="rd-card mt-6 p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent-400">Private invite</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {invite.createdBy.name} invited you to {invite.raise.company.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {ROUND_LABELS[invite.raise.round] ?? invite.raise.round} ·{" "}
            {formatMoney(invite.raise.targetAmount, invite.raise.currency)} · {invite.raise.instrument}
          </p>
          {invite.raise.summary ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">{invite.raise.summary}</p>
          ) : null}
          {expired ? (
            <p className="mt-6 text-sm text-rose-400">This invite has expired.</p>
          ) : user ? (
            <form action={acceptInviteAction.bind(null, invite.token)} className="mt-6">
              <button type="submit" className="rd-btn-primary">
                Join this deal as {user.email}
              </button>
            </form>
          ) : (
            <div className="mt-6 flex gap-2">
              <Link href={`/register?invite=${invite.token}`} className="rd-btn-primary">
                Create investor account
              </Link>
              <Link
                href={`/login?invite=${invite.token}&email=${encodeURIComponent(invite.email)}`}
                className="rd-btn-ghost"
              >
                Sign in
              </Link>
            </div>
          )}
          <p className="mt-4 text-xs text-zinc-500">Issued to {invite.email}. Not a public listing.</p>
        </div>
      </div>
    </div>
  );
}
