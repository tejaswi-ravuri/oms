// Debug script for ledger operations
// Copy and paste this into your browser console on the ledger page

async function debugLedgerOperations() {
  console.log("🔍 Starting Ledger Operations Debug");

  // 1. Check Supabase connection
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("🔐 Auth User:", { user, authError });

    if (authError) {
      console.error("❌ Auth Error:", authError);
      return;
    }

    // 2. Check user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("👤 User Profile:", { profile, profileError });

    // 3. Test fetch ledgers
    const { data: ledgers, error: fetchError } = await supabase
      .from("ledgers")
      .select("*")
      .limit(1);

    console.log("📊 Fetch Test:", { ledgers, fetchError });

    // 4. Test insert operation
    const testLedger = {
      ledger_id: `TEST-${Date.now()}`,
      business_name: "Test Business",
      contact_person_name: "Test Person",
      mobile_number: "1234567890",
      email: "test@example.com",
      address: "Test Address",
      city: "Test City",
      state: "Test State",
      country: "India",
      zip_code: "123456",
      gst_number: null,
      pan_number: null,
      business_logo: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("➕ Testing Insert with data:", testLedger);

    const { data: insertData, error: insertError } = await supabase
      .from("ledgers")
      .insert(testLedger)
      .select();

    console.log("➕ Insert Result:", { insertData, insertError });

    if (insertData && insertData.length > 0) {
      const newLedgerId = insertData[0].ledger_id;

      // 5. Test update operation
      const updateData = {
        business_name: "Updated Test Business",
        updated_at: new Date().toISOString(),
      };

      console.log(
        "✏️ Testing Update with data:",
        updateData,
        "for ledger:",
        newLedgerId
      );

      const { data: updateDataResult, error: updateError } = await supabase
        .from("ledgers")
        .update(updateData)
        .eq("ledger_id", newLedgerId)
        .select();

      console.log("✏️ Update Result:", { updateDataResult, updateError });

      // 6. Test delete operation
      console.log("🗑️ Testing Delete for ledger:", newLedgerId);

      const { data: deleteDataResult, error: deleteError } = await supabase
        .from("ledgers")
        .delete()
        .eq("ledger_id", newLedgerId)
        .select();

      console.log("🗑️ Delete Result:", { deleteDataResult, deleteError });
    }

    // 7. Check RLS policies info
    console.log("📋 Debug complete! Check the results above.");
  } catch (error) {
    console.error("❌ Debug Script Error:", error);
  }
}

// Run the debug function
debugLedgerOperations();
