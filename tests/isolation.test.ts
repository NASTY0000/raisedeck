import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessFile, canAccessFolder, getRaiseForInvestor, AccessError } from "../src/lib/access";
import { fileByName, raiseByName, userByEmail, folderByName } from "./helpers";

describe("data room isolation", () => {
  it("investor A cannot see founder B data room files", async () => {
    const amara = await userByEmail("amara@raisedeck.demo");
    const harvest = await raiseByName("Pre-seed 2026");
    const secret = await fileByName(harvest.id, "Harvest-cap-table-notes.txt");
    const deck = await fileByName(harvest.id, "Harvest-AI-Deck.txt");
    assert.equal(await canAccessFile(amara.id, secret.id), false);
    assert.equal(await canAccessFile(amara.id, deck.id), false);
    await assert.rejects(() => getRaiseForInvestor(harvest.id, amara.id), AccessError);
  });

  it("investor A can see invited raise general files but not ungated financials", async () => {
    const amara = await userByEmail("amara@raisedeck.demo");
    const chidi = await userByEmail("chidi@raisedeck.demo");
    const naija = await raiseByName("Seed 2026");
    const onePager = await fileByName(naija.id, "One-pager.txt");
    const pl = await fileByName(naija.id, "P-and-L-FY25.txt");
    const financials = await folderByName(naija.id, "Financials");
    assert.equal(await canAccessFile(amara.id, onePager.id), true);
    assert.equal(await canAccessFile(amara.id, pl.id), false);
    assert.equal(await canAccessFolder(amara.id, financials.id), false);
    assert.equal(await canAccessFile(chidi.id, pl.id), true);
  });

  it("investor invited only to founder B cannot see founder A files", async () => {
    const kemi = await userByEmail("kemi@raisedeck.demo");
    const naija = await raiseByName("Seed 2026");
    const harvest = await raiseByName("Pre-seed 2026");
    const naijaDeck = await fileByName(naija.id, "NaijaPay-Seed-Deck.txt");
    const harvestDeck = await fileByName(harvest.id, "Harvest-AI-Deck.txt");
    assert.equal(await canAccessFile(kemi.id, naijaDeck.id), false);
    assert.equal(await canAccessFile(kemi.id, harvestDeck.id), true);
  });

  it("founders cannot read the other company's data room", async () => {
    const ada = await userByEmail("ada@raisedeck.demo");
    const bola = await userByEmail("bola@raisedeck.demo");
    const naija = await raiseByName("Seed 2026");
    const harvest = await raiseByName("Pre-seed 2026");
    const naijaPl = await fileByName(naija.id, "P-and-L-FY25.txt");
    const harvestSecret = await fileByName(harvest.id, "Harvest-cap-table-notes.txt");
    assert.equal(await canAccessFile(ada.id, naijaPl.id), true);
    assert.equal(await canAccessFile(ada.id, harvestSecret.id), false);
    assert.equal(await canAccessFile(bola.id, harvestSecret.id), true);
    assert.equal(await canAccessFile(bola.id, naijaPl.id), false);
  });
});
