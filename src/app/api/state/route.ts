import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "data");
const STORAGE_PATH = path.join(STORAGE_DIR, "game-state.json");

export async function GET() {
  try {
    const data = await fs.readFile(STORAGE_PATH, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json(null, { status: 204 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(STORAGE_PATH, JSON.stringify(payload, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to persist state." },
      { status: 500 }
    );
  }
}
