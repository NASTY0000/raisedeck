import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AccessError, getRaiseForInvestor, listAccessibleFolders } from "@/lib/access";

export default async function InvestorDataRoom({ params }: { params: { id: string } }) {
  const user = await requireUser();
  try {
    await getRaiseForInvestor(params.id, user.id);
  } catch (e) {
    if (e instanceof AccessError) notFound();
    throw e;
  }
  const folders = await listAccessibleFolders(params.id, user.id);

  return (
    <div className="space-y-4">
      <Link href={`/invest/deals/${params.id}`} className="text-xs text-zinc-500 hover:text-zinc-200">
        ← Back to deal
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Data room</h1>
      <p className="text-sm text-zinc-400">Only folders the founder granted you.</p>
      {folders.length === 0 ? (
        <div className="rd-card p-5 text-sm text-zinc-500">No folders available yet.</div>
      ) : (
        folders.map((folder) => (
          <section key={folder.id} className="rd-card p-5">
            <h2 className="text-sm font-medium">{folder.name}</h2>
            <ul className="mt-3 divide-y divide-white/5">
              {folder.files.length === 0 ? (
                <li className="py-2 text-sm text-zinc-500">Empty.</li>
              ) : (
                folder.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between py-2 text-sm">
                    <a href={`/api/files/${file.id}`} className="hover:text-accent-300">
                      {file.name}
                      {file.isDeck ? <span className="ml-2 text-[11px] text-accent-400">deck</span> : null}
                    </a>
                    <span className="text-[11px] text-zinc-500">{Math.round(file.size / 1024)} kb</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
