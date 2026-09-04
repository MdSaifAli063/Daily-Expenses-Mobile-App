export interface Shop {
  id: string;
  user_id: string;
  shop_name: string;
  owner_name: string;
  email: string | null;
  mobile: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateShopInput {
  user_id: string;
  shop_name: string;
  owner_name: string;
  email?: string | null;
  mobile?: string | null;
}

export interface UpdateShopInput {
  shop_name?: string;
  owner_name?: string;
  email?: string | null;
  mobile?: string | null;
}
