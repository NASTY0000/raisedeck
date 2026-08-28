import { requireRole } from "@/lib/auth";
import { getRaiseForFounder } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createFolderAction, toggleFolderAccessAction, uploadFileAction } from "@/lib/actions";

export default async function DataRoomPage({ params }: { params: { id: string } }) {
  const user = await requireRole("FOUNDER");
  await getRaiseForFounder(params.id, user.id);
  const [folders, investors] = await Promise.all([
    prisma.dataRoomFolder.findMany({
      where: { raiseId: params.id },
      include: { files: true, access: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.pipelineEntry.findMany({
      where: { raiseId: params.id },
      include: { investor: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <form action={createFolderAction.bind(null, params.id)} className="rd-card flex items-end gap-2 p-4">
          <div className="flex-1">
            <label className="rd-label">New folder</label>
            <input name="name" className="rd-input" placeholder="Customer references" required />
          </div>
          <button className="rd-btn-ghost">Add</button>
        </form>
        <form action={uploadFileAction.bind(null, params.id)} className="rd-card space-y-2 p-4">
          <p className="text-sm font-medium">Upload file</p>
          <select name="folderId" className="rd-input" required>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <input name="file" type="file" required className="block text-sm text-zinc-400" />
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="isDeck" /> Pitch deck (visible to every invited investor)
          </label>
          <button className="rd-btn-primary">Upload</button>
        </form>
      </div>

      {folders.map((folder) => (
        <section key={folder.id} className="rd-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{folder.name}</h2>
            <span className="text-[11px] text-zinc-500">{folder.files.length} files</span>
          </div>
          <ul className="mt-3 divide-y divide-white/5">
            {folder.files.length === 0 ? (
              <li className="py-2 text-sm text-zinc-500">Empty folder.</li>
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
          <div className="mt-4">
            <p className="rd-label">Investor access</p>
            {investors.length === 0 ? (
              <p className="text-xs text-zinc-500">Invite investors to grant folder access.</p>
            ) : (
              <ul className="space-y-1">
                {investors.map((p) => {
                  const granted = folder.access.some((a) => a.investorId === p.investorId && a.canView);
                  return (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span>
                        {p.investor.name}{" "}
                        <span className="text-zinc-500">{granted ? "can view" : "no access"}</span>
                      </span>
                      <form action={toggleFolderAccessAction.bind(null, folder.id, p.investorId)}>
                        <button type="submit" className="text-xs text-accent-300">
                          {granted ? "Revoke" : "Grant"}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
