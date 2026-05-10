export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  whatsapp_number: string | null;
  transfer_alias: string | null;
  transfer_holder: string | null;
  transfer_cuit: string | null;
  transfer_bank: string | null;
  profile_public: boolean;
  created_at: string;
}

export interface Raffle {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  total_numbers: number;
  price_per_number: number;
  status: 'draft' | 'active' | 'finished';
  visibility: 'public' | 'private';
  access_code: string | null;
  cover_icon: string;
  draw_mode: 'all_sold' | 'fixed_date' | 'first_event';
  draw_date: string | null;
  prize_assignment_mode: 'automatic' | 'sequential_choice';
  winner_number: number | null;
  rich_content: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  stats?: {
    total: number;
    sold: number;
    reserved: number;
  };
}

export interface RaffleNumber {
  number: number;
  status: 'available' | 'reserved' | 'sold';
  buyer_name: string | null;
}

export interface Prize {
  id: string;
  raffle_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  position: number;
  winner_number: number | null;
  created_at: string;
}

export interface Promotion {
  id: string;
  raffle_id: string;
  type: 'pack' | 'percentage' | 'bundle';
  label: string;
  quantity: number;
  price: number | null;
  discount_percentage: number | null;
  free_numbers: number | null;
  active: boolean;
  created_at: string;
}

export interface PublicRaffleData {
  raffle: Raffle;
  owner: {
    id: string;
    username: string;
    display_name: string | null;
    whatsapp_number: string | null;
    transfer_alias: string | null;
    transfer_holder: string | null;
    transfer_cuit: string | null;
    transfer_bank: string | null;
  };
  prizes: Prize[];
  promotions: Promotion[];
}
