import { NextResponse } from "next/server";
import { formGate } from "@/lib/form-gate";

export const dynamic = "force-dynamic";

/** The live answer to "is the form open?", for the closed screen's Check again button. */
export async function GET() {
  const { open, title, message } = await formGate({ fresh: true });
  return NextResponse.json({ open, title, message }, { headers: { "Cache-Control": "no-store" } });
}
