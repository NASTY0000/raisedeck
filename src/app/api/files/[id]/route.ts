import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getSessionUser } from "@/lib/auth";
import { assertFileAccess, AccessError } from "@/lib/access";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const file = await assertFileAccess(user.id, params.id);
    const full = join(process.cwd(), "uploads", file.storagePath);
    const buf = await readFile(full);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${file.name.replace(/"/g, "")}"`,
        "Content-Length": String(buf.length),
      },
    });
  } catch (e) {
    if (e instanceof AccessError) {
      return NextResponse.json({ error: e.message }, { status: e.code === "NOT_FOUND" ? 404 : 403 });
    }
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
