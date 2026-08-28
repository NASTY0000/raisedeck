import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createInvite, redeemInvite, AccessError } from "../src/lib/access";
import { hashPassword } from "../src/lib/password";
import { raiseByName, userByEmail } from "./helpers";

describe("invite links", () => {
  it("founder creates a tokenized invite that an investor can redeem", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const email = `lp-${Date.now()}@raisedeck.demo`;
    const invite = await createInvite({
      raiseId: raise.id,
      founderId: ada.id,
      email,
      name: "New LP",
    });
    assert.ok(invite.token.length > 16);

    const investor = await prisma.user.create({
      data: {
        email,
        name: "New LP",
        role: "INVESTOR",
        passwordHash: hashPassword("demo1234"),
      },
    });
    await redeemInvite(invite.token, investor.id);
    const entry = await prisma.pipelineEntry.findUnique({
      where: { raiseId_investorId: { raiseId: raise.id, investorId: investor.id } },
    });
    assert.ok(entry);
    assert.equal(entry?.stage, "INTRO");
    const used = await prisma.invite.findUnique({ where: { id: invite.id } });
    assert.equal(used?.usedById, investor.id);
  });

  it("seed demo invite token exists", async () => {
    const invite = await prisma.invite.findUnique({
      where: { token: "demo-invite-naijapay-seed" },
    });
    assert.ok(invite);
    assert.equal(invite?.email, "newlp@raisedeck.demo");
  });

  it("founders cannot redeem investor invites", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const bola = await userByEmail("bola@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const invite = await createInvite({
      raiseId: raise.id,
      founderId: ada.id,
      email: bola.email,
      name: bola.name,
    });
    await assert.rejects(() => redeemInvite(invite.token, bola.id), AccessError);
  });

  it("wrong email cannot redeem an invite", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const amara = await userByEmail("amara@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const invite = await createInvite({
      raiseId: raise.id,
      founderId: ada.id,
      email: "someone-else@raisedeck.demo",
      name: "Someone",
    });
    await assert.rejects(() => redeemInvite(invite.token, amara.id), AccessError);
  });
});
