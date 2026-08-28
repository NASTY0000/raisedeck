import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

if (process.env.VERCEL || !process.env.DATABASE_URL) {
  const dest = "/tmp/raisedeck.db";
  process.env.DATABASE_URL = `file:${dest}`;
  if (!existsSync(dest)) {
    const sources = [
      join(process.cwd(), "prisma", "seed.db"),
      join(process.cwd(), "seed.db"),
    ];
    let loggedCopyError = false;
    for (const src of sources) {
      try {
        if (existsSync(src)) {
          copyFileSync(src, dest);
          break;
        }
      } catch (err) {
        if (!loggedCopyError) {
          console.error("Failed to copy SQLite seed database from", src, err);
          loggedCopyError = true;
        }
      }
    }
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
