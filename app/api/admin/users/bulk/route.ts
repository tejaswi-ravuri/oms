import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verify the requester is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_role !== "Admin") {
      return NextResponse.json(
        { error: "Not authorized - Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());

    const usersToCreate: any[] = [];
    const errors: string[] = [];

    // Validate headers
    const requiredHeaders = ["email", "first_name", "last_name"];
    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.includes(h)
    );
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required headers: ${missingHeaders.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validHeaders = [
      "email",
      "first_name",
      "last_name",
      "user_role",
      "user_status",
      "mobile",
      "address",
      "city",
      "state",
      "document_type",
      "document_number",
      "dob",
    ];
    const invalidHeaders = headers.filter((h) => !validHeaders.includes(h));
    if (invalidHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid headers: ${invalidHeaders.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse CSV data
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];

        if (char === '"') {
          if (inQuotes && line[charIndex + 1] === '"') {
            current += '"';
            charIndex++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const user: any = {};

      headers.forEach((header, index) => {
        user[header] = values[index] || "";
      });

      // Validate required fields
      if (!user.email || !user.first_name || !user.last_name) {
        errors.push(
          `Row ${i + 1}: Missing required fields (email, first_name, last_name)`
        );
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.push(`Row ${i + 1}: Invalid email format: ${user.email}`);
        continue;
      }

      // Validate user_role if provided
      if (
        user.user_role &&
        !["Admin", "Pmanager", "Imanager", "User"].includes(user.user_role)
      ) {
        errors.push(`Row ${i + 1}: Invalid user_role: ${user.user_role}`);
        continue;
      }

      // Validate user_status if provided
      if (
        user.user_status &&
        !["Active", "Inactive", "Suspended"].includes(user.user_status)
      ) {
        errors.push(`Row ${i + 1}: Invalid user_status: ${user.user_status}`);
        continue;
      }

      // Clean up empty strings
      Object.keys(user).forEach((key) => {
        if (user[key] === "") {
          user[key] = null;
        }
      });

      usersToCreate.push({ ...user, rowNumber: i + 1 });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const userData of usersToCreate) {
      try {
        // Check if email already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const emailExists = existingUser.users.some(
          (u) => u.email === userData.email
        );

        if (emailExists) {
          results.failed++;
          results.errors.push(
            `Row ${userData.rowNumber}: Email already exists: ${userData.email}`
          );
          continue;
        }

        // Create auth user with metadata - trigger will create profile
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password:
              userData.password ||
              `Temp${Math.random().toString(36).slice(-8)}!`, // Generate random password
            email_confirm: true,
            user_metadata: {
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.user_role || "User",
            },
          });

        if (authError) {
          results.failed++;
          results.errors.push(`Row ${userData.rowNumber}: ${authError.message}`);
          continue;
        }

        // Wait for trigger to create profile
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify profile was created by trigger
        const { data: createdProfile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !createdProfile) {
          // If trigger failed to create profile, create it manually
          const { error: manualProfileError } = await supabaseAdmin
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              user_role: userData.user_role || "User",
              user_status: userData.user_status || "Active",
              mobile: userData.mobile,
              address: userData.address,
              city: userData.city,
              state: userData.state,
              document_type: userData.document_type,
              document_number: userData.document_number,
              dob: userData.dob,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (manualProfileError) {
            results.failed++;
            results.errors.push(
              `Row ${userData.rowNumber}: Profile creation failed - ${manualProfileError.message}`
            );
            // Clean up auth user if profile creation failed
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            continue;
          }
        } else {
          // Profile was created by trigger, now update it with additional fields
          const updateData: any = {
            user_status: userData.user_status || "Active",
          };

          if (userData.mobile) updateData.mobile = userData.mobile;
          if (userData.address) updateData.address = userData.address;
          if (userData.city) updateData.city = userData.city;
          if (userData.state) updateData.state = userData.state;
          if (userData.document_type)
            updateData.document_type = userData.document_type;
          if (userData.document_number)
            updateData.document_number = userData.document_number;
          if (userData.dob) updateData.dob = userData.dob;

          // Only update if there are additional fields to add
          if (Object.keys(updateData).length > 1) {
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update(updateData)
              .eq("id", authData.user.id);

            if (updateError) {
              console.warn(
                `Failed to update profile for row ${userData.rowNumber}:`,
                updateError
              );
            }
          }
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Row ${userData.rowNumber}: Unexpected error - ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${usersToCreate.length} users. ${results.success} created, ${results.failed} failed.`,
      results,
    });
  } catch (error) {
    console.error("Bulk user creation error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 }
    );
  }
}