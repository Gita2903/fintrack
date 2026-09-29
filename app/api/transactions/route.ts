import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DEFAULT_BUDGETS } from "@/lib/storage";

// GET /api/transactions — fetch all transactions for logged-in user
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
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize: Supabase returns date as "YYYY-MM-DD", amount as number
  const normalized = data.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    amount: Number(t.amount),
    category: t.category,
    payment_method: t.payment_method,
    description: t.description,
    created_at: t.created_at,
  }));

  return NextResponse.json(normalized);
}

// POST /api/transactions — create a new transaction
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, type, amount, category, payment_method, description } = body;

  if (!date || !type || !amount || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const id = "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      id,
      user_id: user.id,
      date,
      type,
      amount: Number(amount),
      category,
      payment_method: payment_method || "Tunai / Cash",
      description: description || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, amount: Number(data.amount) }, { status: 201 });
}

// DELETE /api/transactions?id=xxx — delete a transaction
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/transactions — update a transaction
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Only allow these fields to be updated
  const allowed = ["date", "type", "amount", "category", "payment_method", "description"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updateData[key] = key === "amount" ? Number(fields[key]) : fields[key];
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, amount: Number(data.amount) });
}
