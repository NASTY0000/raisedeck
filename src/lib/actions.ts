"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "./prisma";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  homeForRole,
  requireRole,
  requireUser,
  verifyPassword,
} from "./auth";
import {
  AccessError,
  createInvite,
  getRaiseForFounder,
  recordCommitment,
  redeemInvite,
} from "./access";
import { PIPELINE_STAGES } from "./constants";

function fail(error: unknown) {
  if (error instanceof AccessError) return { error: error.message };
  if (error instanceof z.ZodError) return { error: error.errors[0]?.message ?? "Invalid input" };
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    redirect("/login");
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return { error: "You do not have permission to do that." };
  }
  console.error(error);
  return { error: "Something went wrong." };
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["FOUNDER", "INVESTOR"]),
  companyName: z.string().optional(),
  firmName: z.string().optional(),
});

export async function registerAction(_prev: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyName: formData.get("companyName") || undefined,
    firmName: formData.get("firmName") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const data = parsed.data;
  const email = data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "An account with that email already exists." };
  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      role: data.role,
      passwordHash: hashPassword(data.password),
    },
  });
  if (data.role === "FOUNDER") {
    await prisma.company.create({
      data: {
        founderId: user.id,
        name: data.companyName || `${data.name}'s company`,
        tagline: "",
        sector: "",
        location: "",
      },
    });
  } else {
    await prisma.investorProfile.create({
      data: {
        userId: user.id,
        firmName: data.firmName || null,
        title: "Investor",
      },
    });
  }
  await createSession(user.id);
  const inviteToken = formData.get("inviteToken");
  if (typeof inviteToken === "string" && inviteToken) {
    try {
      const invite = await redeemInvite(inviteToken, user.id);
      redirect(`/invest/deals/${invite.raiseId}`);
    } catch (e) {
      return fail(e);
    }
  }
  redirect(homeForRole(user.role));
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }
  await createSession(user.id);
  const inviteToken = formData.get("inviteToken");
  if (typeof inviteToken === "string" && inviteToken) {
    try {
      const invite = await redeemInvite(inviteToken, user.id);
      redirect(`/invest/deals/${invite.raiseId}`);
    } catch {
      redirect(homeForRole(user.role));
    }
  }
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const raiseSchema = z.object({
  name: z.string().min(2),
  round: z.enum(["PRE_SEED", "SEED", "SERIES_A"]),
  targetAmount: z.coerce.number().positive(),
  currency: z.enum(["USD", "NGN"]),
  instrument: z.enum(["SAFE", "EQUITY", "CONVERTIBLE"]),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("ACTIVE"),
  valuation: z.coerce.number().optional(),
  valuationCap: z.coerce.number().optional(),
  summary: z.string().optional(),
});

export async function createRaiseAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireRole("FOUNDER");
    const parsed = raiseSchema.safeParse({
      name: formData.get("name"),
      round: formData.get("round"),
      targetAmount: formData.get("targetAmount"),
      currency: formData.get("currency"),
      instrument: formData.get("instrument"),
      status: formData.get("status") || "ACTIVE",
      valuation: formData.get("valuation") || undefined,
      valuationCap: formData.get("valuationCap") || undefined,
      summary: formData.get("summary") || "",
    });
    if (!parsed.success) return { error: parsed.error.errors[0].message };
    const company = await prisma.company.findUnique({ where: { founderId: user.id } });
    if (!company) return { error: "Create a company profile first." };
    const raise = await prisma.raise.create({
      data: { companyId: company.id, ...parsed.data, summary: parsed.data.summary ?? "" },
    });
    await prisma.dataRoomFolder.createMany({
      data: [
        { raiseId: raise.id, name: "General", sortOrder: 0 },
        { raiseId: raise.id, name: "Financials", sortOrder: 1 },
        { raiseId: raise.id, name: "Legal", sortOrder: 2 },
      ],
    });
    await prisma.activity.create({
      data: {
        raiseId: raise.id,
        actorId: user.id,
        type: "RAISE_CREATED",
        message: `Opened ${raise.name}`,
      },
    });
    redirect(`/app/raises/${raise.id}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    return fail(e);
  }
}

export async function updateRaiseAction(raiseId: string, formData: FormData) {
  try {
    const user = await requireRole("FOUNDER");
    await getRaiseForFounder(raiseId, user.id);
    const parsed = raiseSchema.partial().safeParse({
      name: formData.get("name") || undefined,
      round: formData.get("round") || undefined,
      targetAmount: formData.get("targetAmount") || undefined,
      currency: formData.get("currency") || undefined,
      instrument: formData.get("instrument") || undefined,
      status: formData.get("status") || undefined,
      valuation: formData.get("valuation") || undefined,
      valuationCap: formData.get("valuationCap") || undefined,
      summary: formData.get("summary") ?? undefined,
    });
    if (!parsed.success) return { error: parsed.error.errors[0].message };
    await prisma.raise.update({ where: { id: raiseId }, data: parsed.data });
    revalidatePath(`/app/raises/${raiseId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function inviteInvestorAction(raiseId: string, formData: FormData) {
  try {
    const user = await requireRole("FOUNDER");
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    if (!email) return { error: "Email is required." };
    const invite = await createInvite({ raiseId, founderId: user.id, email, name });
    revalidatePath(`/app/raises/${raiseId}/pipeline`);
    return { ok: true, token: invite.token };
  } catch (e) {
    return fail(e);
  }
}

export async function updatePipelineAction(entryId: string, formData: FormData): Promise<void> {
  const user = await requireRole("FOUNDER");
  const entry = await prisma.pipelineEntry.findUnique({
    where: { id: entryId },
    include: { raise: { include: { company: true } }, investor: true },
  });
  if (!entry || entry.raise.company.founderId !== user.id) return;
  const stage = String(formData.get("stage") ?? entry.stage);
  if (!PIPELINE_STAGES.includes(stage as (typeof PIPELINE_STAGES)[number])) return;
  await prisma.pipelineEntry.update({
    where: { id: entryId },
    data: {
      stage,
      nextAction: String(formData.get("nextAction") ?? entry.nextAction ?? ""),
      notes: String(formData.get("notes") ?? entry.notes),
      introSource: String(formData.get("introSource") ?? entry.introSource),
    },
  });
  if (stage !== entry.stage) {
    await prisma.activity.create({
      data: {
        raiseId: entry.raiseId,
        actorId: user.id,
        type: "STAGE_CHANGED",
        message: `Moved ${entry.investor.name} to ${stage.replace("_", " ").toLowerCase()}`,
      },
    });
  }
  revalidatePath(`/app/raises/${entry.raiseId}/pipeline`);
}

export async function addCommitmentAction(raiseId: string, formData: FormData) {
  try {
    const user = await requireRole("FOUNDER");
    const investorId = String(formData.get("investorId") ?? "");
    const amount = Number(formData.get("amount"));
    const type = String(formData.get("type") ?? "SOFT") as "SOFT" | "SIGNED";
    const result = await recordCommitment({
      raiseId,
      founderId: user.id,
      investorId,
      amount,
      type,
    });
    revalidatePath(`/app/raises/${raiseId}`);
    revalidatePath(`/app/raises/${raiseId}/pipeline`);
    return { ok: true, filledPercent: result.progress.filledPercent };
  } catch (e) {
    return fail(e);
  }
}

export async function createFolderAction(raiseId: string, formData: FormData): Promise<void> {
  const user = await requireRole("FOUNDER");
  await getRaiseForFounder(raiseId, user.id);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.dataRoomFolder.create({ data: { raiseId, name } });
  revalidatePath(`/app/raises/${raiseId}/data-room`);
}

export async function toggleFolderAccessAction(folderId: string, investorId: string): Promise<void> {
  const user = await requireRole("FOUNDER");
  const folder = await prisma.dataRoomFolder.findUnique({
    where: { id: folderId },
    include: { raise: { include: { company: true } } },
  });
  if (!folder || folder.raise.company.founderId !== user.id) return;
  const existing = await prisma.dataRoomAccess.findUnique({
    where: { folderId_investorId: { folderId, investorId } },
  });
  if (existing) {
    await prisma.dataRoomAccess.delete({ where: { id: existing.id } });
  } else {
    await prisma.dataRoomAccess.create({
      data: { folderId, investorId, canView: true },
    });
  }
  revalidatePath(`/app/raises/${folder.raiseId}/data-room`);
}

export async function uploadFileAction(raiseId: string, formData: FormData): Promise<void> {
  try {
    const user = await requireRole("FOUNDER");
    await getRaiseForFounder(raiseId, user.id);
    const folderId = String(formData.get("folderId") ?? "");
    const isDeck = formData.get("isDeck") === "on" || formData.get("isDeck") === "true";
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    const folder = await prisma.dataRoomFolder.findFirst({ where: { id: folderId, raiseId } });
    if (!folder) return;
    const id = randomBytes(8).toString("hex");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${raiseId}/${id}-${safeName}`;
    const full = join(process.cwd(), "uploads", storagePath);
    await mkdir(dirname(full), { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(full, buf);
    const created = await prisma.dataRoomFile.create({
      data: {
        raiseId,
        folderId,
        uploadedById: user.id,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        isDeck,
      },
    });
    if (isDeck) {
      await prisma.raise.update({ where: { id: raiseId }, data: { deckFileId: created.id } });
    }
    await prisma.activity.create({
      data: {
        raiseId,
        actorId: user.id,
        type: "FILE_UPLOADED",
        message: `Uploaded ${file.name}${isDeck ? " as pitch deck" : ""}`,
      },
    });
    revalidatePath(`/app/raises/${raiseId}/data-room`);
    revalidatePath(`/app/raises/${raiseId}`);
  } catch (e) {
    fail(e);
  }
}

export async function publishUpdateAction(raiseId: string, formData: FormData): Promise<void> {
  try {
    const user = await requireRole("FOUNDER");
    await getRaiseForFounder(raiseId, user.id);
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!title || !body) return;
    await prisma.investorUpdate.create({
      data: { raiseId, authorId: user.id, title, body },
    });
    await prisma.activity.create({
      data: {
        raiseId,
        actorId: user.id,
        type: "UPDATE_PUBLISHED",
        message: `Published update: ${title}`,
      },
    });
    revalidatePath(`/app/raises/${raiseId}/updates`);
    revalidatePath(`/invest/deals/${raiseId}`);
  } catch (e) {
    fail(e);
  }
}

export async function investorSignalAction(raiseId: string, intent: "INTERESTED" | "MEETING_REQUESTED" | "PASSED") {
  try {
    const user = await requireUser();
    if (user.role === "FOUNDER") return { error: "Founders cannot signal on deals." };
    const entry = await prisma.pipelineEntry.findUnique({
      where: { raiseId_investorId: { raiseId, investorId: user.id } },
      include: { raise: { include: { company: true } } },
    });
    if (!entry) return { error: "You do not have access to this deal." };
    const stage =
      intent === "PASSED"
        ? "PASSED"
        : intent === "MEETING_REQUESTED" && entry.stage === "INTRO"
          ? "MEETING"
          : entry.stage;
    await prisma.pipelineEntry.update({
      where: { id: entry.id },
      data: { investorIntent: intent, stage },
    });
    const label =
      intent === "INTERESTED"
        ? "marked interested"
        : intent === "MEETING_REQUESTED"
          ? "requested a meeting"
          : "passed on the round";
    await prisma.activity.create({
      data: {
        raiseId,
        actorId: user.id,
        type: intent === "PASSED" ? "PASSED" : intent === "MEETING_REQUESTED" ? "MEETING_REQUESTED" : "INTEREST_MARKED",
        message: `${user.name} ${label}`,
      },
    });
    revalidatePath(`/invest/deals/${raiseId}`);
    revalidatePath(`/invest`);
    revalidatePath(`/app/raises/${raiseId}/pipeline`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function acceptInviteAction(token: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?invite=${token}`);
  const invite = await redeemInvite(token, user.id);
  redirect(`/invest/deals/${invite.raiseId}`);
}

export async function updateCompanyAction(formData: FormData): Promise<void> {
  const user = await requireRole("FOUNDER");
  await prisma.company.update({
    where: { founderId: user.id },
    data: {
      name: String(formData.get("name") ?? ""),
      tagline: String(formData.get("tagline") ?? ""),
      website: String(formData.get("website") ?? "") || null,
      sector: String(formData.get("sector") ?? ""),
      location: String(formData.get("location") ?? ""),
      foundedYear: formData.get("foundedYear")
        ? Number(formData.get("foundedYear"))
        : null,
    },
  });
  revalidatePath("/app");
  revalidatePath("/app/company");
}
