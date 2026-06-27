import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/api/errors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return unauthorized();
  }

  // Fetch full user profile (without passwordHash)
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!profile) {
    return unauthorized();
  }

  return NextResponse.json({ user: profile });
}
