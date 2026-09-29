import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DEFAULT_BUDGETS } from "@/lib/storage";

// GET /api/budgets — fetch all budgets for logged-in user
// Auto-seeds default budgets if user has none yet
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("category, monthly_limit")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seed default budgets for new users
  if (data.length === 0) {
    const seeds = DEFAULT_BUDGETS.map((b) => ({
      user_id: user.id,
      category: b.category,
      monthly_limit: b.monthly_limit,
    }));
    const { data: seeded, error: seedError } = await supabase
      .from("budgets")
      .insert(seeds)
      .select("category, monthly_limit");

    if (seedError) {
      return NextResponse.json({ error: seedError.message }, { status: 500 });
    }

    return NextResponse.json(
      seeded.map((b) => ({ category: b.category, monthly_limit: Number(b.monthly_limit) }))
    );
  }

  return NextResponse.json(
    data.map((b) => ({ category: b.category, monthly_limit: Number(b.monthly_limit) }))
  );
}

// PUT /api/budgets — replace all budgets for logged-in user (upsert)
export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const budgets: Array<{ category: string; monthly_limit: number }> = body;

  if (!Array.isArray(budgets) || budgets.length === 0) {
    return NextResponse.json({ error: "Invalid budgets payload" }, { status: 400 });
  }

  // Upsert all — update if category exists, insert if not
  const upsertData = budgets.map((b) => ({
    user_id: user.id,
    category: b.category,
    monthly_limit: Number(b.monthly_limit),
  }));

  const { error } = await supabase
    .from("budgets")
    .upsert(upsertData, { onConflict: "user_id,category" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete budgets that are no longer in the list
  const keepCategories = budgets.map((b) => b.category);
  await supabase
    .from("budgets")
    .delete()
    .eq("user_id", user.id)
    .not("category", "in", `(${keepCategories.map((c) => `"${c}"`).join(",")})`);

  return NextResponse.json({ success: true });
}
