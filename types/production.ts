// Production Management Types - Updated to match existing database schema

export interface Purchase {
  id: number;
  purchase_date: string;
  purchase_no: string;
  vendor_ledger_id?: string;
  material_type: string;
  total_meters: number;
  rate_per_meter?: number;
  total_amount?: number;
  gst_percent?: string;
  invoice_number?: string;
  remarks?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseFormData {
  purchase_date: string;
  purchase_no: string;
  vendor_ledger_id?: string;
  material_type: string;
  total_meters: number;
  rate_per_meter?: number;
  total_amount?: number;
  gst_percent?: string;
  invoice_number?: string;
  remarks?: string;
}

export interface WeaverChallan {
  id: number;
  challan_no: string;
  challan_date: string;
  purchase_id?: number;
  weaver_ledger_id?: string;
  material_type?: string;
  ms_party_name?: string;
  batch_number?: string;
  total_grey_mtr?: number;
  taka?: number;
  quantity_sent_meters: number;
  quantity_received_meters?: number;
  weaving_loss_meters?: number;
  loss_percentage?: number;
  rate_per_meter?: number;
  vendor_amount?: number;
  transport_name?: string;
  lr_number?: string;
  transport_charge?: number;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeaverChallanFormData {
  challan_no: string;
  challan_date: string;
  purchase_id?: number;
  weaver_ledger_id?: string;
  material_type?: string;
  ms_party_name?: string;
  batch_number?: string;
  total_grey_mtr?: number;
  taka?: number;
  quantity_sent_meters: number;
  quantity_received_meters?: number;
  rate_per_meter?: number;
  vendor_amount?: number;
  transport_name?: string;
  lr_number?: string;
  transport_charge?: number;
  status?: string;
}

// types/production.ts - Add/Update these types

export interface ShortingEntry {
  id?: number;
  entry_date: string;
  entry_no: string;
  weaver_challan_id?: number | null;
  purchase_id?: number | null;
  material_type: string;
  batch_number?: string | null;
  total_pieces: number;
  good_pieces: number;
  damaged_pieces: number;
  rejected_pieces: number;
  size_breakdown?: Record<string, number> | null;
  remarks?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  weaver_challan?: {
    id: number;
    challan_no: string;
    weaver_ledger_id: string;
    material_type: string;
    ms_party_name?: string;
  };
  purchase?: {
    id: number;
    purchase_no: string;
    vendor_ledger_id: string;
    material_type: string;
  };
}

export interface ShortingEntryFormData {
  entry_date: string;
  entry_no: string;
  weaver_challan_id?: number;
  purchase_id?: number;
  material_type: string;
  batch_number?: string;
  total_pieces: number;
  good_pieces?: number;
  damaged_pieces?: number;
  rejected_pieces?: number;
  size_breakdown?: Record<string, number>;
  remarks?: string;
}

export interface StitchingChallan {
  id: number;
  challan_no: string;
  challan_date: string;
  ledger_id?: string;
  batch_numbers: string[];
  product_name?: string;
  product_sku?: string;
  quantity_sent: number;
  quantity_received?: number;
  stitching_loss?: number;
  loss_percentage?: number;
  rate_per_piece?: number;
  amount_payable?: number;
  total_good?: number;
  total_bad?: number;
  total_wastage?: number;
  size_breakdown?: any;
  transport_name?: string;
  lr_number?: string;
  transport_charge?: number;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StitchingChallanFormData {
  challan_no: string;
  challan_date: string;
  ledger_id?: string | number;
  batch_numbers?: string[];
  product_name?: string;
  product_sku?: string;

  quantity_sent: number;
  quantity_received?: number | string;

  rate_per_piece?: number | string;
  transport_charge?: number | string;

  size_breakdown?: Record<string, number> | null;

  transport_name?: string;
  lr_number?: string;
  status?: string;
}


export interface QualityInspection {
  id: number;
  stitching_challan_id: number;
  inspected_by: string;
  inspected_at: string;
  good_qty: number;
  bad_qty: number;
  wastage_qty: number;
  remarks?: string;
  qc_status: "Draft" | "Approved" | "Rejected";
  created_at: string;
  updated_at: string;
}

export interface FinalProduct {
  id: number;
  stitching_challan_id?: number;
  product_sku: string;
  product_name: string;
  batch_number: string;
  total_produced: number;
  created_at: string;
  created_by?: string;
}

export interface Inventory {
  id: number;
  final_product_id: number;
  product_sku: string;
  product_name: string;
  size: string;
  quantity: number;
  condition_type: "GOOD" | "BAD" | "WASTE";
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  expense_date: string;
  expense_type: string;
  challan_no?: string;
  challan_type?: string;
  description?: string;
  cost: number;
  paid_to?: string;
  payment_mode?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  expense_date: string;
  expense_type: string;
  challan_no?: string;
  challan_type?: string;
  description?: string;
  cost: number;
  paid_to?: string;
  payment_mode?: string;
}

export interface PaymentVoucher {
  id: number;
  voucher_no: string;
  payment_date: string;
  ledger_id?: string;
  payment_for?: string; // This field may not exist in database yet
  amount: number;
  payment_mode: string;
  reference_no?: string;
  remarks?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentVoucherFormData {
  voucher_no: string;
  payment_date: string;
  ledger_id?: string;
  payment_for?: string; // This field may not exist in database yet
  amount: number;
  payment_mode: string;
  reference_no?: string;
  remarks?: string;
}

export interface Ledger {
  ledger_id: string;
  business_name: string;
  business_logo?: string;
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
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  edit_logs?: string;
}

export interface LedgerInsert {
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

export interface LedgerUpdate extends Partial<LedgerInsert> {
  ledger_id?: string;
}

// Analytics Types
export interface RawMaterialStock {
  material_type: string;
  total_purchased_meters: number;
  total_sent_to_weaver_meters: number;
  available_meters: number;
}

export interface MaterialInProduction {
  stage: string;
  quantity: number;
  unit: string;
}

export interface FinishedGoods {
  condition_type: string;
  total_quantity: number;
  unique_products: number;
  total_value: number;
}

export interface ProductionEfficiency {
  metric_name: string;
  value: number;
  unit: string;
}

export interface MonthlyExpense {
  month: string;
  expense_type: string;
  total_cost: number;
  transaction_count: number;
}

export interface LedgerDue {
  ledger_id: string;
  name: string;
  ledger_type: string;
  total_invoiced: number;
  total_paid: number;
  due_amount: number;
}

export interface TopProduct {
  product_sku: string;
  product_name: string;
  good_qty: number;
  bad_qty: number;
  waste_qty: number;
  total_qty: number;
}

export interface ProductionDashboardData {
  rawMaterialStock: RawMaterialStock[];
  materialInProduction: MaterialInProduction[];
  finishedGoods: FinishedGoods[];
  productionEfficiency: ProductionEfficiency[];
  monthlyExpenses: MonthlyExpense[];
  ledgerDues: LedgerDue[];
  topProducts: TopProduct[];
}

// Filter types
export interface ProductionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  materialType?: string;
  vendorId?: string;
  productSku?: string;
  search?: string;
}

// Bulk operation types
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

// User interface
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_role?: string;
  user_status?: string;
}
