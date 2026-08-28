import { prisma } from "./prisma";
import { percent } from "./utils";
import { randomBytes } from "crypto";

export class AccessError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "FORBIDDEN" | "UNAUTHENTICATED" | "INVALID" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "AccessError";
  }
}

export async function getRaiseForFounder(raiseId: string, founderId: string) {
  const raise = await prisma.raise.findUnique({
    where: { id: raiseId },
    include: { company: true },
  });
  if (!raise) throw new AccessError("Raise not found", "NOT_FOUND");
  if (raise.company.founderId !== founderId) {
    throw new AccessError("You do not own this raise", "FORBIDDEN");
  }
  return raise;
}

export async function investorCanSeeRaise(investorId: string, raiseId: string) {
  const entry = await prisma.pipelineEntry.findUnique({
    where: { raiseId_investorId: { raiseId, investorId } },
  });
  return Boolean(entry);
}

export async function getRaiseForInvestor(raiseId: string, investorId: string) {
  const raise = await prisma.raise.findUnique({
    where: { id: raiseId },
    include: {
      company: { include: { founder: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!raise) throw new AccessError("Raise not found", "NOT_FOUND");
  const allowed = await investorCanSeeRaise(investorId, raiseId);
  if (!allowed) throw new AccessError("You were not invited to this raise", "FORBIDDEN");
  return raise;
}

export async function canAccessFolder(userId: string, folderId: string) {
  const folder = await prisma.dataRoomFolder.findUnique({
    where: { id: folderId },
    include: { raise: { include: { company: true } } },
  });
  if (!folder) return false;
  if (folder.raise.company.founderId === userId) return true;
  const membership = await prisma.firmMembership.findFirst({
    where: { userId, role: "ADMIN" },
  });
  if (membership) {
    const partnerOnDeal = await prisma.pipelineEntry.findFirst({
      where: {
        raiseId: folder.raiseId,
        investor: { firmMemberships: { some: { firmId: membership.firmId } } },
      },
    });
    if (partnerOnDeal) return true;
  }
  return folderHasInvestorAccess(folderId, userId);
}

async function folderHasInvestorAccess(folderId: string, investorId: string): Promise<boolean> {
  let currentId: string | null = folderId;
  const seen = new Set<string>();
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const grant = await prisma.dataRoomAccess.findUnique({
      where: { folderId_investorId: { folderId: currentId, investorId } },
    });
    if (grant?.canView) return true;
    const folder: { parentId: string | null } | null = await prisma.dataRoomFolder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = folder?.parentId ?? null;
  }
  return false;
}

export async function canAccessFile(userId: string, fileId: string) {
  const file = await prisma.dataRoomFile.findUnique({
    where: { id: fileId },
    include: { folder: { include: { raise: { include: { company: true } } } } },
  });
  if (!file) return false;
  if (file.folder.raise.company.founderId === userId) return true;
  if (file.isDeck) {
    return investorCanSeeRaise(userId, file.raiseId);
  }
  return canAccessFolder(userId, file.folderId);
}

export async function assertFileAccess(userId: string, fileId: string) {
  const ok = await canAccessFile(userId, fileId);
  if (!ok) throw new AccessError("No access to this file", "FORBIDDEN");
  const file = await prisma.dataRoomFile.findUnique({ where: { id: fileId } });
  if (!file) throw new AccessError("File not found", "NOT_FOUND");
  return file;
}

export async function listAccessibleFolders(raiseId: string, userId: string) {
  const folders = await prisma.dataRoomFolder.findMany({
    where: { raiseId },
    include: { files: true, access: true },
    orderBy: { sortOrder: "asc" },
  });
  const raise = await prisma.raise.findUnique({
    where: { id: raiseId },
    include: { company: true },
  });
  if (!raise) return [];
  if (raise.company.founderId === userId) return folders;
  const out = [];
  for (const folder of folders) {
    if (await canAccessFolder(userId, folder.id)) out.push(folder);
  }
  return out;
}

export async function raiseProgress(raiseId: string) {
  const raise = await prisma.raise.findUnique({
    where: { id: raiseId },
    include: { commitments: true },
  });
  if (!raise) throw new AccessError("Raise not found", "NOT_FOUND");
  const signed = raise.commitments
    .filter((c) => c.type === "SIGNED")
    .reduce((s, c) => s + c.amount, 0);
  const soft = raise.commitments
    .filter((c) => c.type === "SOFT")
    .reduce((s, c) => s + c.amount, 0);
  return {
    target: raise.targetAmount,
    currency: raise.currency,
    signed,
    soft,
    filled: signed,
    filledPercent: percent(signed, raise.targetAmount),
    softPercent: percent(signed + soft, raise.targetAmount),
  };
}

export async function recordCommitment(input: {
  raiseId: string;
  founderId: string;
  investorId: string;
  amount: number;
  type: "SOFT" | "SIGNED";
  currency?: string;
}) {
  if (!(input.amount > 0)) throw new AccessError("Amount must be positive", "INVALID");
  const raise = await getRaiseForFounder(input.raiseId, input.founderId);
  const investor = await prisma.user.findUnique({ where: { id: input.investorId } });
  if (!investor || investor.role === "FOUNDER") {
    throw new AccessError("Investor not found", "NOT_FOUND");
  }
  const onPipeline = await prisma.pipelineEntry.findUnique({
    where: { raiseId_investorId: { raiseId: input.raiseId, investorId: input.investorId } },
  });
  if (!onPipeline) {
    throw new AccessError("Investor is not on this raise pipeline", "FORBIDDEN");
  }
  const commitment = await prisma.commitment.create({
    data: {
      raiseId: input.raiseId,
      investorId: input.investorId,
      amount: input.amount,
      currency: input.currency ?? raise.currency,
      type: input.type,
    },
  });
  if (input.type === "SIGNED") {
    await prisma.pipelineEntry.update({
      where: { id: onPipeline.id },
      data: { stage: "COMMITTED" },
    });
  }
  await prisma.activity.create({
    data: {
      raiseId: input.raiseId,
      actorId: input.founderId,
      type: "COMMITMENT_ADDED",
      message: `${investor.name} ${input.type === "SIGNED" ? "signed" : "soft-circled"} ${input.amount} ${commitment.currency}`,
    },
  });
  return { commitment, progress: await raiseProgress(input.raiseId) };
}

export async function createInvite(input: {
  raiseId: string;
  founderId: string;
  email: string;
  name?: string;
}) {
  await getRaiseForFounder(input.raiseId, input.founderId);
  const token = randomBytes(24).toString("hex");
  const invite = await prisma.invite.create({
    data: {
      raiseId: input.raiseId,
      token,
      email: input.email.trim().toLowerCase(),
      name: input.name ?? "",
      createdById: input.founderId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.activity.create({
    data: {
      raiseId: input.raiseId,
      actorId: input.founderId,
      type: "INVESTOR_INVITED",
      message: `Invite sent to ${invite.email}`,
    },
  });
  return invite;
}

export async function redeemInvite(token: string, userId: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { raise: { include: { company: true } } },
  });
  if (!invite) throw new AccessError("Invite not found", "NOT_FOUND");
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new AccessError("Invite expired", "INVALID");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AccessError("User not found", "NOT_FOUND");
  if (user.role === "FOUNDER") {
    throw new AccessError("Founders cannot redeem investor invites", "FORBIDDEN");
  }
  if (invite.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AccessError("This invite was issued to a different email", "FORBIDDEN");
  }
  const existing = await prisma.pipelineEntry.findUnique({
    where: { raiseId_investorId: { raiseId: invite.raiseId, investorId: userId } },
  });
  if (!existing) {
    await prisma.pipelineEntry.create({
      data: {
        raiseId: invite.raiseId,
        investorId: userId,
        stage: "INTRO",
        introSource: "Invite link",
        nextAction: "Review deck",
      },
    });
  }
  const general = await prisma.dataRoomFolder.findFirst({
    where: { raiseId: invite.raiseId, name: "General" },
  });
  if (general) {
    await prisma.dataRoomAccess.upsert({
      where: { folderId_investorId: { folderId: general.id, investorId: userId } },
      update: { canView: true },
      create: { folderId: general.id, investorId: userId, canView: true },
    });
  }
  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedById: userId },
  });
  await prisma.activity.create({
    data: {
      raiseId: invite.raiseId,
      actorId: userId,
      type: "INVITE_REDEEMED",
      message: `${user.name} accepted an invite`,
    },
  });
  return invite;
}

export function roleCanAccessFounderApp(role: string) {
  return role === "FOUNDER" || role === "FIRM_ADMIN";
}

export function roleCanAccessInvestorApp(role: string) {
  return role === "INVESTOR" || role === "FIRM_ADMIN";
}
