export interface Location {
  id: number;
  location_key: string;
  location_name: string;
  address: string;
  phone?: string | null;
}

export interface Business {
  id: number;
  business_key: string;
  business_name: string;
  subscription_type: string;
  about_business: string | null;
  address?: string | null;
  logo?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

export interface User {
  id: number;
  name: string;
  creator: 'Host' | 'Manager' | 'Staff';
  active_business_key: string;
  active_location_key?: string;
  business_key: string;
  businesses_one?: Business[];
  about_business: string;
}