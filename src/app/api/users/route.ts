import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-server";

// GET /api/users - list all users (admin only)
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select(
      "id, username, display_name, display_name_th, display_name_jp, email, phone, department, avatar_url, language, is_active, must_change_password, last_login_at, created_at, role_id, position_id, roles(name, name_th, name_en, name_jp, level)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data ?? []).map((u: Record<string, unknown>) => {
    const role = u.roles as { name: string; level: number } | null;
    const { roles: _roles, ...rest } = u;
    void _roles;
    return { ...rest, role: role?.name ?? "member", role_level: role?.level ?? 0 };
  });

  return NextResponse.json({ users });
}

// POST /api/users - create a new user (admin only)
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  try {
    const body = await request.json();
    const {
      username,
      display_name,
      display_name_th,
      display_name_jp,
      email,
      phone,
      department,
      role_id,
      position_id,
      language,
    } = body;

    if (!username || !display_name || !role_id) {
      return NextResponse.json(
        { error: "username, display_name, role_id are required" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 chars (a-z, A-Z, 0-9, _)" },
        { status: 400 }
      );
    }

    // Hash default password "00000000" via RPC
    const { data: hashed, error: hashError } = await supabaseAdmin.rpc(
      "hash_password",
      { p_password: "00000000" }
    );

    if (hashError || !hashed) {
      return NextResponse.json(
        { error: "Failed to hash default password" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("app_users")
      .insert({
        username,
        password_hash: hashed,
        display_name,
        display_name_th: display_name_th || null,
        display_name_jp: display_name_jp || null,
        email: email || null,
        phone: phone || null,
        department: department || null,
        role_id,
        position_id: position_id || null,
        language: language || "th",
        is_active: true,
        must_change_password: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Username or email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { user: data, default_password: "00000000" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
