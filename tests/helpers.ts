import { prisma } from "../src/lib/prisma";

export async function userByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Missing seed user ${email}`);
  return user;
}

export async function raiseByName(name: string) {
  const raise = await prisma.raise.findFirst({
    where: { name },
    include: { company: true, folders: true, files: true },
  });
  if (!raise) throw new Error(`Missing seed raise ${name}`);
  return raise;
}

export async function fileByName(raiseId: string, name: string) {
  const file = await prisma.dataRoomFile.findFirst({ where: { raiseId, name } });
  if (!file) throw new Error(`Missing file ${name}`);
  return file;
}

export async function folderByName(raiseId: string, name: string) {
  const folder = await prisma.dataRoomFolder.findFirst({ where: { raiseId, name } });
  if (!folder) throw new Error(`Missing folder ${name}`);
  return folder;
}
