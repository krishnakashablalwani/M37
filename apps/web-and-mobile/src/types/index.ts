export type UserRole = 'SUPER_ADMIN' | 'DISTRIBUTOR' | 'RETAILER' | 'SALES_REP';
export type ProductCategory = 'PHARMA' | 'SURGICAL' | 'FMCG';
export type DrugSchedule = 'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'NON_PHARMA';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Organization {
  id: string;
  org_type: UserRole;
  legal_name: string;
  trade_name: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  drug_license_no_20: string | null;
  drug_license_no_21: string | null;
  dl_valid_until: string | null;
  kyc_state: KycStatus;
  pincode: string;
  city: string;
  state: string;
  address_line: string;
  serviceable_pincodes?: string[];
  min_order_value: number;
  delivery_charge: number;
  reliability_score: number;
}

export interface MasterProduct {
  id: string;
  sku_code: string;
  barcode: string | null;
  brand_name: string;
  generic_composition: string | null;
  manufacturer: string;
  category: ProductCategory;
  schedule: DrugSchedule;
  pack_size: string;
  uom: string;
  hsn_code: string;
  gst_percentage: number;
  image_url: string | null;
  // Aggregated availability info
  distributor_count?: number;
  min_ptr?: number;
  max_mrp?: number;
  total_available_qty?: number;
  best_scheme?: string | null;
}

export interface DistributorBatchListing {
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  mrp: number;
  ptr: number;
  discount_pct: number;
  scheme_description: string | null;
  scheme_base_qty: number | null;
  scheme_free_qty: number | null;
  moq: number;
  available_qty: number;
  distributor_id: string;
  distributor_name: string;
  distributor_phone: string;
  city: string;
  reliability_score: number;
  min_order_value: number;
  delivery_charge: number;
  is_preferred?: boolean;
  net_landing_price?: number;
  delivery_sla?: string;
}

export interface CartItem {
  master_product_id: string;
  brand_name: string;
  generic_composition: string | null;
  pack_size: string;
  category: ProductCategory;
  schedule: DrugSchedule;
  batch_id: string;
  batch_number: string;
  distributor_id: string;
  distributor_name: string;
  unit_ptr: number;
  mrp: number;
  gst_pct: number;
  scheme_description: string | null;
  moq: number;
  quantity: number;
}
