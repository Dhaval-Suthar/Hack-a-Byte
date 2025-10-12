import { NextResponse } from "next/server";
import connectDb from "@/db/connectDb";
import Team from "@/models/Team";

type BackfillRequest = {
  adminKey?: string;
  // If true, update all teams whose balance is not 100
  force?: boolean;
  // If true, do not write changes, just return what would be changed
  dryRun?: boolean;
};

function isAdminKeyValid(key?: string): boolean {
  const valid = process.env.ADMIN_AUTH_KEY || "hackabyte-admin-key-2024";
  return !!key && key.trim() === valid;
}

export async function POST(req: Request) {
  try {
    const { adminKey, force = false, dryRun = false } = (await req.json().catch(() => ({}))) as BackfillRequest;

    if (!isAdminKeyValid(adminKey)) {
      return NextResponse.json({ error: "Unauthorized: invalid admin key" }, { status: 401 });
    }

    await connectDb();

    // Fetch teams minimally
    const teams = await Team.find({}).select("_id name wallet.bitcoinBalance");

    let matched = 0;
    let updated = 0;
    const changed: Array<{ id: string; name: string; from: number; to: number }> = [];

    for (const t of teams) {
      const bal = t.wallet?.bitcoinBalance ?? 0;
      const shouldUpdate = force ? bal !== 100 : [500, 1000, 10000].includes(bal);
      if (!shouldUpdate) continue;

      matched++;
      changed.push({ id: t._id.toString(), name: t.name, from: bal, to: 100 });

      if (!dryRun) {
        t.wallet.bitcoinBalance = 100;
        await t.save();
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      force,
      dryRun,
      matched,
      updated,
      changed: changed.slice(0, 50), // cap response size
      note: dryRun
        ? "Dry-run: no changes were written. Re-run with dryRun=false to apply."
        : "Completed. Consider re-running with force=true if you want to set all non-100 balances to 100.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to backfill team balances", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
