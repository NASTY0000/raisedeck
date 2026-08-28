import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateCompanyAction } from "@/lib/actions";

export default async function CompanyPage() {
  const user = await requireRole("FOUNDER");
  const company = await prisma.company.findUnique({ where: { founderId: user.id } });
  if (!company) return <p>Missing company profile.</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Company</h1>
      <p className="mt-1 text-sm text-zinc-400">Shown to investors you invite. Not a public profile.</p>
      <form action={updateCompanyAction} className="rd-card mt-6 space-y-3 p-5">
        <div>
          <label className="rd-label">Name</label>
          <input name="name" defaultValue={company.name} className="rd-input" required />
        </div>
        <div>
          <label className="rd-label">Tagline</label>
          <input name="tagline" defaultValue={company.tagline} className="rd-input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rd-label">Sector</label>
            <input name="sector" defaultValue={company.sector} className="rd-input" />
          </div>
          <div>
            <label className="rd-label">Location</label>
            <input name="location" defaultValue={company.location} className="rd-input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rd-label">Website</label>
            <input name="website" defaultValue={company.website ?? ""} className="rd-input" />
          </div>
          <div>
            <label className="rd-label">Founded</label>
            <input
              name="foundedYear"
              type="number"
              defaultValue={company.foundedYear ?? ""}
              className="rd-input"
            />
          </div>
        </div>
        <button type="submit" className="rd-btn-primary">
          Save
        </button>
      </form>
    </div>
  );
}
