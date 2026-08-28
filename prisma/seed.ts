import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function writeUpload(relative: string, contents: string) {
  const full = join(process.cwd(), "uploads", relative);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
  return relative;
}

async function upsertUser(data: {
  email: string;
  name: string;
  role: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash: hashPassword(data.password),
    },
  });
}

async function log(raiseId: string, actorId: string, type: string, message: string, at?: Date) {
  await prisma.activity.create({
    data: { raiseId, actorId, type, message, createdAt: at ?? new Date() },
  });
}

async function main() {
  const password = "demo1234";

  const ada = await upsertUser({
    email: "ada@raisedeck.demo",
    name: "Ada Okonkwo",
    role: "FOUNDER",
    password,
  });
  const bola = await upsertUser({
    email: "bola@raisedeck.demo",
    name: "Bola Adeyemi",
    role: "FOUNDER",
    password,
  });
  const amara = await upsertUser({
    email: "amara@raisedeck.demo",
    name: "Amara Nwosu",
    role: "INVESTOR",
    password,
  });
  const chidi = await upsertUser({
    email: "chidi@raisedeck.demo",
    name: "Chidi Bassey",
    role: "INVESTOR",
    password,
  });
  const kemi = await upsertUser({
    email: "kemi@raisedeck.demo",
    name: "Kemi Cole",
    role: "INVESTOR",
    password,
  });

  await prisma.investorProfile.upsert({
    where: { userId: amara.id },
    update: {},
    create: {
      userId: amara.id,
      firmName: "Sahel Ventures",
      title: "Partner",
      thesis: "Pre-seed and seed fintech across West Africa. Cheques $100–400k.",
      chequeMin: 100000,
      chequeMax: 400000,
      currency: "USD",
    },
  });
  await prisma.investorProfile.upsert({
    where: { userId: chidi.id },
    update: {},
    create: {
      userId: chidi.id,
      firmName: "Niger Delta Capital",
      title: "Principal",
      thesis: "Seed software with clear path to Series A. Cheques $250k–$1M.",
      chequeMin: 250000,
      chequeMax: 1000000,
      currency: "USD",
    },
  });
  await prisma.investorProfile.upsert({
    where: { userId: kemi.id },
    update: {},
    create: {
      userId: kemi.id,
      firmName: "Baobab Angels",
      title: "Solo GP",
      thesis: "Climate + agritech at pre-seed.",
      chequeMin: 25000,
      chequeMax: 100000,
      currency: "USD",
    },
  });

  const firm = await prisma.firm.upsert({
    where: { slug: "sahel-ventures" },
    update: {},
    create: { name: "Sahel Ventures", slug: "sahel-ventures" },
  });
  await prisma.firmMembership.upsert({
    where: { firmId_userId: { firmId: firm.id, userId: amara.id } },
    update: {},
    create: { firmId: firm.id, userId: amara.id, role: "PARTNER" },
  });

  let naija = await prisma.company.findUnique({ where: { founderId: ada.id } });
  if (!naija) {
    naija = await prisma.company.create({
      data: {
        founderId: ada.id,
        name: "NaijaPay",
        tagline: "Compliant payouts for African platforms that scale past WhatsApp ops.",
        website: "https://naijapay.example",
        sector: "Fintech",
        location: "Lagos, Nigeria",
        foundedYear: 2023,
      },
    });
  }

  let harvest = await prisma.company.findUnique({ where: { founderId: bola.id } });
  if (!harvest) {
    harvest = await prisma.company.create({
      data: {
        founderId: bola.id,
        name: "Harvest AI",
        tagline: "Computer vision for smallholder yield and credit scoring.",
        website: "https://harvestai.example",
        sector: "Agritech",
        location: "Ibadan, Nigeria",
        foundedYear: 2024,
      },
    });
  }

  let seedRound = await prisma.raise.findFirst({
    where: { companyId: naija.id, name: "Seed 2026" },
  });
  if (!seedRound) {
    seedRound = await prisma.raise.create({
      data: {
        companyId: naija.id,
        name: "Seed 2026",
        round: "SEED",
        targetAmount: 1_200_000,
        currency: "USD",
        instrument: "SAFE",
        status: "ACTIVE",
        valuationCap: 8_000_000,
        summary:
          "Raising $1.2M on a post-money SAFE, $8M cap. 18 months of runway to $120k MRR and Series A conversations.",
      },
    });
  }

  let harvestRaise = await prisma.raise.findFirst({
    where: { companyId: harvest.id, name: "Pre-seed 2026" },
  });
  if (!harvestRaise) {
    harvestRaise = await prisma.raise.create({
      data: {
        companyId: harvest.id,
        name: "Pre-seed 2026",
        round: "PRE_SEED",
        targetAmount: 400_000,
        currency: "USD",
        instrument: "EQUITY",
        status: "ACTIVE",
        valuation: 3_000_000,
        summary: "Pre-seed to deploy field units across Oyo and Kaduna.",
      },
    });
  }

  async function ensureFolder(raiseId: string, name: string, sortOrder: number) {
    const existing = await prisma.dataRoomFolder.findFirst({ where: { raiseId, name } });
    if (existing) return existing;
    return prisma.dataRoomFolder.create({ data: { raiseId, name, sortOrder } });
  }

  const general = await ensureFolder(seedRound.id, "General", 0);
  const financials = await ensureFolder(seedRound.id, "Financials", 1);
  const legal = await ensureFolder(seedRound.id, "Legal", 2);
  const harvestGeneral = await ensureFolder(harvestRaise.id, "General", 0);
  const harvestFinancials = await ensureFolder(harvestRaise.id, "Financials", 1);

  async function ensureFile(opts: {
    raiseId: string;
    folderId: string;
    uploadedById: string;
    name: string;
    contents: string;
    isDeck?: boolean;
  }) {
    const existing = await prisma.dataRoomFile.findFirst({
      where: { raiseId: opts.raiseId, name: opts.name },
    });
    if (existing) return existing;
    const id = randomBytes(8).toString("hex");
    const storagePath = writeUpload(
      `${opts.raiseId}/${id}-${opts.name}`,
      opts.contents,
    );
    const file = await prisma.dataRoomFile.create({
      data: {
        raiseId: opts.raiseId,
        folderId: opts.folderId,
        uploadedById: opts.uploadedById,
        name: opts.name,
        mimeType: "text/plain",
        size: Buffer.byteLength(opts.contents),
        storagePath,
        isDeck: Boolean(opts.isDeck),
      },
    });
    if (opts.isDeck) {
      await prisma.raise.update({ where: { id: opts.raiseId }, data: { deckFileId: file.id } });
    }
    return file;
  }

  await ensureFile({
    raiseId: seedRound.id,
    folderId: general.id,
    uploadedById: ada.id,
    name: "NaijaPay-Seed-Deck.txt",
    isDeck: true,
    contents:
      "NAIJAPAY  —  SEED DECK (text stand-in)\n\nProblem: African platforms still run payouts on WhatsApp + spreadsheets.\nSolution: Compliant payouts API + dashboard. Licensed partner rails in NG, KE, GH.\nTraction: $38k MRR, 14 customers, 112% NRR.\nRaise: $1.2M SAFE, $8M cap. Use of funds: 50% eng, 30% compliance, 20% GTM.\n",
  });
  await ensureFile({
    raiseId: seedRound.id,
    folderId: general.id,
    uploadedById: ada.id,
    name: "One-pager.txt",
    contents:
      "NaijaPay one-pager\nFintech · Lagos\nSeed · $1.2M · SAFE\nCustomers: logistics, payroll, marketplaces.\n",
  });
  await ensureFile({
    raiseId: seedRound.id,
    folderId: financials.id,
    uploadedById: ada.id,
    name: "P-and-L-FY25.txt",
    contents:
      "CONFIDENTIAL — NaijaPay P&L FY25\nRevenue 312k  COGS 41k  Gross 271k  OpEx 490k  Net (219k)\nRunway at current burn: 9 months. Target with this round: 18 months.\n",
  });
  await ensureFile({
    raiseId: seedRound.id,
    folderId: legal.id,
    uploadedById: ada.id,
    name: "SAFE-template.txt",
    contents: "Y Combinator Post-Money SAFE (template). Cap $8,000,000. Discount none. MFN yes.\n",
  });
  await ensureFile({
    raiseId: harvestRaise.id,
    folderId: harvestGeneral.id,
    uploadedById: bola.id,
    name: "Harvest-AI-Deck.txt",
    isDeck: true,
    contents:
      "HARVEST AI — PRE-SEED DECK\nVision models for smallholder yield. Pilot with 2 cooperatives. Raise $400k on equity.\n",
  });
  await ensureFile({
    raiseId: harvestRaise.id,
    folderId: harvestFinancials.id,
    uploadedById: bola.id,
    name: "Harvest-cap-table-notes.txt",
    contents: "CONFIDENTIAL Harvest AI — founder 80 / advisor 8 / ESOP 12. No prior priced round.\n",
  });

  async function ensurePipeline(data: {
    raiseId: string;
    investorId: string;
    stage: string;
    intent: string;
    nextAction?: string;
    notes?: string;
    introSource?: string;
  }) {
    return prisma.pipelineEntry.upsert({
      where: { raiseId_investorId: { raiseId: data.raiseId, investorId: data.investorId } },
      update: {
        stage: data.stage,
        investorIntent: data.intent,
        nextAction: data.nextAction,
        notes: data.notes,
        introSource: data.introSource,
      },
      create: {
        raiseId: data.raiseId,
        investorId: data.investorId,
        stage: data.stage,
        investorIntent: data.intent,
        nextAction: data.nextAction,
        notes: data.notes ?? "",
        introSource: data.introSource ?? "",
      },
    });
  }

  await ensurePipeline({
    raiseId: seedRound.id,
    investorId: amara.id,
    stage: "MEETING",
    intent: "MEETING_REQUESTED",
    nextAction: "Send follow-up deck appendix",
    notes: "Warm intro from Tunde at Paystack alumni. Likes the compliance angle.",
    introSource: "Tunde (Paystack alumni)",
  });
  await ensurePipeline({
    raiseId: seedRound.id,
    investorId: chidi.id,
    stage: "DD",
    intent: "INTERESTED",
    nextAction: "Share FY25 P&L and cohort retention",
    notes: "In diligence. Asked for unit economics and a customer reference.",
    introSource: "Cold via raise update",
  });
  await ensurePipeline({
    raiseId: harvestRaise.id,
    investorId: kemi.id,
    stage: "INTRO",
    intent: "INTERESTED",
    nextAction: "Schedule first call",
    notes: "Met at AgriTech Lagos. Wants field unit demo.",
    introSource: "AgriTech Lagos",
  });

  await prisma.dataRoomAccess.upsert({
    where: { folderId_investorId: { folderId: general.id, investorId: amara.id } },
    update: { canView: true },
    create: { folderId: general.id, investorId: amara.id, canView: true },
  });
  await prisma.dataRoomAccess.upsert({
    where: { folderId_investorId: { folderId: general.id, investorId: chidi.id } },
    update: { canView: true },
    create: { folderId: general.id, investorId: chidi.id, canView: true },
  });
  await prisma.dataRoomAccess.upsert({
    where: { folderId_investorId: { folderId: financials.id, investorId: chidi.id } },
    update: { canView: true },
    create: { folderId: financials.id, investorId: chidi.id, canView: true },
  });
  await prisma.dataRoomAccess.upsert({
    where: { folderId_investorId: { folderId: legal.id, investorId: chidi.id } },
    update: { canView: true },
    create: { folderId: legal.id, investorId: chidi.id, canView: true },
  });
  await prisma.dataRoomAccess.upsert({
    where: { folderId_investorId: { folderId: harvestGeneral.id, investorId: kemi.id } },
    update: { canView: true },
    create: { folderId: harvestGeneral.id, investorId: kemi.id, canView: true },
  });
  await prisma.dataRoomAccess.upsert({
    where: { folderId_investorId: { folderId: harvestFinancials.id, investorId: kemi.id } },
    update: { canView: true },
    create: { folderId: harvestFinancials.id, investorId: kemi.id, canView: true },
  });

  const existingCommit = await prisma.commitment.findFirst({
    where: { raiseId: seedRound.id, investorId: chidi.id, type: "SOFT" },
  });
  if (!existingCommit) {
    await prisma.commitment.create({
      data: {
        raiseId: seedRound.id,
        investorId: chidi.id,
        amount: 250000,
        currency: "USD",
        type: "SOFT",
      },
    });
  }
  const signed = await prisma.commitment.findFirst({
    where: { raiseId: seedRound.id, type: "SIGNED" },
  });
  if (!signed) {
    await prisma.commitment.create({
      data: {
        raiseId: seedRound.id,
        investorId: chidi.id,
        amount: 150000,
        currency: "USD",
        type: "SIGNED",
      },
    });
  }

  const updateCount = await prisma.investorUpdate.count({ where: { raiseId: seedRound.id } });
  if (updateCount === 0) {
    await prisma.investorUpdate.create({
      data: {
        raiseId: seedRound.id,
        authorId: ada.id,
        title: "March: $38k MRR and first Ghana corridor",
        body: "We closed two marketplace logos and turned on the Ghana payout corridor with our licensed partner. NRR 112%. Opening the SAFE this week — $150k already signed, $250k soft from NDC. Happy to jump on a 20-min call.",
      },
    });
  }

  const harvestUpdate = await prisma.investorUpdate.count({ where: { raiseId: harvestRaise.id } });
  if (harvestUpdate === 0) {
    await prisma.investorUpdate.create({
      data: {
        raiseId: harvestRaise.id,
        authorId: bola.id,
        title: "Pilot cooperatives signed",
        body: "Two Oyo cooperatives are live. Next: Kaduna field units if we close the pre-seed.",
      },
    });
  }

  const demoInvite = await prisma.invite.findFirst({
    where: { raiseId: seedRound.id, email: "newlp@raisedeck.demo" },
  });
  if (!demoInvite) {
    await prisma.invite.create({
      data: {
        raiseId: seedRound.id,
        token: "demo-invite-naijapay-seed",
        email: "newlp@raisedeck.demo",
        name: "New LP",
        createdById: ada.id,
        expiresAt: new Date("2027-12-31"),
      },
    });
  }

  const activityCount = await prisma.activity.count({ where: { raiseId: seedRound.id } });
  if (activityCount === 0) {
    await log(seedRound.id, ada.id, "RAISE_CREATED", "Opened Seed 2026 on a post-money SAFE");
    await log(seedRound.id, ada.id, "INVESTOR_INVITED", "Invite sent to amara@raisedeck.demo");
    await log(seedRound.id, amara.id, "MEETING_REQUESTED", "Amara Nwosu requested a meeting");
    await log(seedRound.id, ada.id, "STAGE_CHANGED", "Moved Amara Nwosu to Meeting");
    await log(seedRound.id, chidi.id, "INTEREST_MARKED", "Chidi Bassey marked interested");
    await log(seedRound.id, ada.id, "STAGE_CHANGED", "Moved Chidi Bassey to Due diligence");
    await log(seedRound.id, ada.id, "COMMITMENT_ADDED", "Chidi Bassey signed 150000 USD");
    await log(seedRound.id, ada.id, "UPDATE_PUBLISHED", "Published March investor update");
  }

  const hCount = await prisma.activity.count({ where: { raiseId: harvestRaise.id } });
  if (hCount === 0) {
    await log(harvestRaise.id, bola.id, "RAISE_CREATED", "Opened Pre-seed 2026");
    await log(harvestRaise.id, bola.id, "INVESTOR_INVITED", "Invite sent to kemi@raisedeck.demo");
  }

  console.log("Seeded RaiseDeck demo data.");
  console.log("  Founder  ada@raisedeck.demo     / demo1234   (NaijaPay Seed)");
  console.log("  Founder  bola@raisedeck.demo    / demo1234   (Harvest AI, isolation)");
  console.log("  Investor amara@raisedeck.demo   / demo1234   (Meeting on NaijaPay)");
  console.log("  Investor chidi@raisedeck.demo   / demo1234   (DD on NaijaPay)");
  console.log("  Investor kemi@raisedeck.demo    / demo1234   (Harvest AI only)");
  console.log("  Invite   /invite/demo-invite-naijapay-seed  (newlp@raisedeck.demo)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
