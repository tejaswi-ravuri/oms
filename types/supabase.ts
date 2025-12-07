// Add this to your @/types/supabase.ts file

export type UserRole = 'Admin' | 'Manager' | 'User' | 'Pmanager' | 'Imanager';
export type UserStatus = 'Active' | 'Inactive';
export type DocumentType = 'Passport' | 'Aadhar' | 'PAN' | 'Driving License' | 'Voter ID';

export interface Profile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  user_role?: UserRole | null;
  user_status?: UserStatus | null;
  profile_photo?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  document_type?: DocumentType | string | null;
  document_number?: string | null;
  dob?: string | null; // Date string in ISO format
  created_at?: string | null;
  updated_at?: string | null;
}

// Optional: Helper type for creating new profiles (without id, timestamps)
export interface ProfileInsert {
  id: string; // Must match auth.users.id
  email: string;
  first_name?: string;
  last_name?: string;
  user_role?: UserRole;
  user_status?: UserStatus;
  profile_photo?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  document_type?: DocumentType | string;
  document_number?: string;
  dob?: string;
}

// Optional: Helper type for updating profiles (all fields optional)
export interface ProfileUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  user_role?: UserRole;
  user_status?: UserStatus;
  profile_photo?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  document_type?: DocumentType | string;
  document_number?: string;
  dob?: string;
  updated_at?: string;
}

// You can also export the User type from Supabase if needed elsewhere