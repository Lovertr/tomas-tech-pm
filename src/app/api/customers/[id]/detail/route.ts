import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Get customer basic info
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (customerError) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get all deals for this customer with owner info
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from("deals")
      .select("*, owner:app_users!owner_id(id, email, display_name)")
      .eq("customer_id", id)
      .order("updated_at", { ascending: false });

    // Get all activities for this customer's deals
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from("deal_activities")
      .select("*, performer:app_users!performed_by(id, email, display_name)")
      .eq("customer_id", id)
      .order("activity_date", { ascending: false });

    // Get all projects linked to this customer
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .ilike("client_name", `%${customer.company_name}%`)
      .order("created_at", { ascending: false });

    // Get quotations for this customer
    const { data: quotations, error: quotationsError } = await supabaseAdmin
      .from("quotations")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    // Get invoices for this customer
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    // Get comments for this customer
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from("customer_comments")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    // Calculate summary stats
    const totalDealValue = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
    const wonDeals = deals?.filter((deal) => deal.stage === "project_complete") || [];
    const wonDealsCount = wonDeals.length;
    const winRate = deals?.length ? ((wonDealsCount / deals.length) * 100).toFixed(2) : "0";
    const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

    return NextResponse.json({
      customer,
      deals: deals ?? [],
      activities: activities ?? [],
      projects: projects ?? [],
      quotations: quotations ?? [],
      invoices: invoices ?? [],
      comments: comments ?? [],
      summary: {
        totalDealValue,
        wonDealsCount,
        winRate: parseFloat(winRate as string),
        totalRevenue,
        totalDeals: deals?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
