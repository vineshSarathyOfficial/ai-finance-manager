import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeStatementFile } from "@/lib/import/parse-statement";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized. Please log in again." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, message: "No file provided." }, { status: 400 });
    }

    const result = await analyzeStatementFile(session.user.id, file);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("[import/parse] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to parse the statement file." },
      { status: 500 }
    );
  }
}
