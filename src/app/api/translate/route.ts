import { NextRequest } from "next/server";
import { POST as translatePost } from "@/app/api/ai/translate/route";

// Backward-compatibility wrapper — delegates to /api/ai/translate
export async function POST(req: NextRequest) {
  return translatePost(req);
}
