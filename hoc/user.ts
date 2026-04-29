export interface User {
  id: number;
  name: string;
  creator: "Host" | string;
  email: string;
  email_verified_at: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  postal_code: string | null;
  country: string | null;
  about: string | null;
  profile_pic: string | null;
  account_tier: string;
  locations: any | null;
  business_key: string;
  active_business_key: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;

  user_roles: UserRole;
  businesses_one: Business[];
}

export interface UserRole {
  id: number;
  user_id: number;
  business_key: string;
  owner_id: number;

  permission: "yes" | "no";

  users_create: "yes" | "no";
  users_read: "yes" | "no";
  users_update: "yes" | "no";
  users_delete: "yes" | "no";

  subscriptions_read: "yes" | "no";
  subscriptions_update: "yes" | "no";

  locations_create: "yes" | "no";
  locations_read: "yes" | "no";
  locations_update: "yes" | "no";
  locations_delete: "yes" | "no";
  locations_analytics: "yes" | "no";

  category_create: "yes" | "no";
  category_read: "yes" | "no";
  category_update: "yes" | "no";
  category_delete: "yes" | "no";

  product_create: "yes" | "no";
  product_read: "yes" | "no";
  product_update: "yes" | "no";
  product_delete: "yes" | "no";

  unit_create: "yes" | "no";
  unit_read: "yes" | "no";
  unit_update: "yes" | "no";
  unit_delete: "yes" | "no";

  vendor_create: "yes" | "no";
  vendor_read: "yes" | "no";
  vendor_update: "yes" | "no";
  vendor_delete: "yes" | "no";

  purchase_create: "yes" | "no";
  purchase_read: "yes" | "no";
  purchase_update: "yes" | "no";
  purchase_delete: "yes" | "no";
  purchase_approve: "yes" | "no";
  purchase_received: "yes" | "no";
  purchase_cancel: "yes" | "no";
  purchase_process_all: "yes" | "no";

  customer_create: "yes" | "no";
  customer_read: "yes" | "no";
  customer_update: "yes" | "no";
  customer_delete: "yes" | "no";

  credit_note_create: "yes" | "no";
  credit_note_read: "yes" | "no";
  credit_note_update: "yes" | "no";
  credit_note_delete: "yes" | "no";

  expense_create: "yes" | "no";
  expense_read: "yes" | "no";
  expense_update: "yes" | "no";
  expense_delete: "yes" | "no";

  invoice_create: "yes" | "no";
  invoice_read: "yes" | "no";
  invoice_update: "yes" | "no";
  invoice_delete: "yes" | "no";

  pos_create: "yes" | "no";
  pos_read: "yes" | "no";
  pos_update: "yes" | "no";
  pos_delete: "yes" | "no";

  can_edit_price: "yes" | "no";
  can_adjust_stock: "yes" | "no";
  can_transfer_stock: "yes" | "no";
  can_view_cost: "yes" | "no";

  created_at: string;
  updated_at: string;
}

export interface Business {
  id: number;
  owner_id: number;
  business_key: string;
  business_name: string;
  slug: string;
  registration_no: string | null;
  industry_type: string;
  email: string | null;
  currency: string;
  website: string | null;
  about_business: string;
  phone: string;
  address: string;
  country: string;
  subscription_type: string;
  subscription_plan: string;
  language: string;
  state: string;
  city: string;
  logo: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  remember_token: string | null;
}