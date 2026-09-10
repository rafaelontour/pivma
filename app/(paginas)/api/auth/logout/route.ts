import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logout } from "@/services/Autenticacao";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    await logout(accessToken);
  }

  cookieStore.delete("access_token");
  return new NextResponse(null, { status: 204 });
}
