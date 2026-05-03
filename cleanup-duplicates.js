const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const SUPABASE_URL = "https://yntqhjjqevxkuyhcpfhe.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findDuplicates() {
  console.log("Fetching all customers...");

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, company_name, created_at, created_by")
    .order("company_name", { ascending: true });

  if (error) {
    console.error("Error fetching customers:", error);
    process.exit(1);
  }

  console.log(`Total customers found: ${customers.length}`);

  // Group by company_name to find duplicates
  const groups = {};
  customers.forEach(customer => {
    const key = customer.company_name?.toLowerCase().trim() || "unknown";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(customer);
  });

  // Find duplicates
  const duplicates = Object.entries(groups).filter(([name, items]) => items.length > 1);

  if (duplicates.length === 0) {
    console.log("\nNo duplicate customers found!");
    return;
  }

  console.log(`\nFound ${duplicates.length} duplicate customer names:\n`);

  const toDelete = [];

  duplicates.forEach(([name, items]) => {
    console.log(`Company: "${name}" (${items.length} records)`);
    items.forEach((item, idx) => {
      const createdDate = new Date(item.created_at).toLocaleString();
      console.log(`  ${idx + 1}. ID: ${item.id} | Created: ${createdDate}`);
    });

    // Keep the oldest (first) one, mark others for deletion
    items.slice(1).forEach(item => {
      toDelete.push(item.id);
    });

    console.log("");
  });

  console.log(`\nSummary: ${toDelete.length} duplicate records ready to delete`);
  console.log("IDs to delete:", toDelete);

  return toDelete;
}

async function deleteDuplicates(ids) {
  if (ids.length === 0) {
    console.log("No duplicates to delete.");
    return;
  }

  console.log(`\nDeleting ${ids.length} duplicate customer records...`);

  for (const id of ids) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      console.error(`Error deleting customer ${id}:`, error);
    } else {
      console.log(`Deleted customer ID: ${id}`);
    }
  }

  console.log("\nCleanup complete!");
}

async function main() {
  try {
    const duplicateIds = await findDuplicates();

    if (duplicateIds && duplicateIds.length > 0) {
      // Ask for confirmation (in automated mode, we skip this)
      console.log("\nReady to delete duplicates. Call deleteDuplicates() to proceed.");

      // Uncomment to auto-delete:
      // await deleteDuplicates(duplicateIds);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

main();
