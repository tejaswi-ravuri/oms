// Business Ledger Interface
export interface Ledger {
  id: string;
  ledger_id: string;
  
  // Business Information
  business_name: string;
  contact_person_name?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  
  // Address Information
  address?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
  
  // Tax Information
  gst_number?: string | null;
  pan_number?: string | null;
  
  // Business Logo
  business_logo?: string | null;
  
  // Audit fields
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields (from joins)
  creator_email?: string;
  updater_email?: string;
}

export interface LedgerFormData {
  business_name: string;
  contact_person_name?: string;
  mobile_number?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  gst_number?: string;
  pan_number?: string;
  business_logo?: string;
}

export interface LedgerListResponse {
  ledgers: Ledger[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LedgerFilters {
  search?: string;
  city?: string;
  state?: string;
  has_gst?: string;
}

export interface LedgerBulkOperation {
  action: "delete";
  ledger_ids: string[];
  notes?: string;
}

export interface LedgerImportData {
  business_name: string;
  contact_person_name?: string;
  mobile_number?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  gst_number?: string;
  pan_number?: string;
  business_logo?: string;
}