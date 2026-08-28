import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { raiseProgress, recordCommitment, AccessError } from "../src/lib/access";
import { raiseByName, userByEmail } from "./helpers";

describe("commitments update round progress", () => {
  it("seeded signed amount is reflected in percent filled", async () => {
    const raise = await raiseByName("Seed 2026");
    const progress = await raiseProgress(raise.id);
    assert.equal(progress.target, 1_200_000);
    assert.ok(progress.signed >= 150000);
    assert.ok(progress.filledPercent > 0);
    assert.equal(progress.filledPercent, Math.min(100, Math.round((progress.signed / 1_200_000) * 1000) / 10));
  });

  it("recording a signed commitment increases filled percent", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const amara = await userByEmail("amara@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const before = await raiseProgress(raise.id);
    const result = await recordCommitment({
      raiseId: raise.id,
      founderId: ada.id,
      investorId: amara.id,
      amount: 100000,
      type: "SIGNED",
    });
    assert.ok(result.progress.signed >= before.signed + 100000);
    assert.ok(result.progress.filledPercent > before.filledPercent);
  });

  it("soft circles do not count as signed fill", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const amara = await userByEmail("amara@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    const before = await raiseProgress(raise.id);
    const result = await recordCommitment({
      raiseId: raise.id,
      founderId: ada.id,
      investorId: amara.id,
      amount: 50000,
      type: "SOFT",
    });
    assert.equal(result.progress.signed, before.signed);
    assert.ok(result.progress.soft >= before.soft + 50000);
  });

  it("cannot record a commitment for an investor not on the pipeline", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const kemi = await userByEmail("kemi@raisedeck.demo");
    const raise = await raiseByName("Seed 2026");
    await assert.rejects(
      () =>
        recordCommitment({
          raiseId: raise.id,
          founderId: ada.id,
          investorId: kemi.id,
          amount: 10000,
          type: "SIGNED",
        }),
      AccessError,
    );
  });
});
