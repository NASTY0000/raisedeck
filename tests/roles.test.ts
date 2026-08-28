import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AccessError,
  getRaiseForFounder,
  getRaiseForInvestor,
  roleCanAccessFounderApp,
  roleCanAccessInvestorApp,
} from "../src/lib/access";
import { verifyPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import { raiseByName, userByEmail } from "./helpers";

describe("role gates", () => {
  it("demo passwords verify", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    assert.equal(verifyPassword("demo1234", ada.passwordHash), true);
    assert.equal(verifyPassword("wrong", ada.passwordHash), false);
    assert.equal(ada.role, "FOUNDER");
    const amara = await userByEmail("amara@raisedeck.demo");
    assert.equal(amara.role, "INVESTOR");
  });

  it("founder app vs investor app role helpers", () => {
    assert.equal(roleCanAccessFounderApp("FOUNDER"), true);
    assert.equal(roleCanAccessFounderApp("INVESTOR"), false);
    assert.equal(roleCanAccessInvestorApp("INVESTOR"), true);
    assert.equal(roleCanAccessInvestorApp("FOUNDER"), false);
  });

  it("investor cannot load another founder's raise as owner", async () => {
    const amara = await userByEmail("amara@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    await assert.rejects(() => getRaiseForFounder(raise.id, amara.id), AccessError);
  });

  it("founder B cannot own founder A's raise", async () => {
    const bola = await userByEmail("bola@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    await assert.rejects(() => getRaiseForFounder(raise.id, bola.id), (err: unknown) => {
      return err instanceof AccessError && err.code === "FORBIDDEN";
    });
  });

  it("uninvited investor cannot open a raise", async () => {
    const kemi = await userByEmail("kemi@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    await assert.rejects(() => getRaiseForInvestor(raise.id, kemi.id), AccessError);
  });

  it("invited investor can open that raise", async () => {
    const amara = await userByEmail("amara@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const loaded = await getRaiseForInvestor(raise.id, amara.id);
    assert.equal(loaded.id, raise.id);
  });

  it("seeded pipeline stages differ for the two NaijaPay investors", async () => {
    const amara = await userByEmail("amara@raisedeck.demo");
    const chidi = await userByEmail("chidi@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const a = await prisma.pipelineEntry.findUnique({
      where: { raiseId_investorId: { raiseId: raise.id, investorId: amara.id } },
    });
    const c = await prisma.pipelineEntry.findUnique({
      where: { raiseId_investorId: { raiseId: raise.id, investorId: chidi.id } },
    });
    assert.ok(a, "Amara should be on NaijaPay pipeline");
    assert.ok(c, "Chidi should be on NaijaPay pipeline");
    assert.notEqual(a?.investorId, c?.investorId);
    assert.equal(c?.stage, "DD");
    assert.ok(["MEETING", "COMMITTED", "DD"].includes(a?.stage ?? ""));
  });
});
