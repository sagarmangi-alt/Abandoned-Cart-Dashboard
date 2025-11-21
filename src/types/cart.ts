export interface AbandonedCart {
  id?: number;
  _id?: string;
  customer_id: string;
  first_name: string;
  email: string;
  phone: string;
  checkout_id: string;
  call_id: string;
  call_successful: boolean;
  call_status: string;
  ended_reason: string;
  product_name: string;
  short_product_name: string;
  original_price: number;
  country: string;
  city: string;
  transcript: string;
  summary: string;
  interested: boolean;
  answered_by_ai: boolean;
  agreed_to_get_sms: boolean;
  received_sms: boolean;
  recording_url: string;
  created_at: string;
  bought_from_automation: boolean;
}
