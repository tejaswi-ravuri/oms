// app/api/auth/signup/route.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, userRole = 'User' } = body;

    // create the auth user and set metadata.role so JWT contains role
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: userRole,
        first_name: firstName,
        last_name: lastName
      }
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    // Optionally update profiles row fields (trigger created the profile with id + email).
    // This is server-side and bypasses RLS.
    const userId = data.user?.id;
    if (userId) {
      const { error: upserr } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          user_role: userRole,
          user_status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (upserr) {
        // log server-side; still return success for created auth user
        console.error('Profile update error:', upserr);
      }
    }

    return new Response(JSON.stringify({ user: data.user }), { status: 201 });
  } catch (err: any) {
    console.error('Signup route error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), { status: 500 });
  }
}
