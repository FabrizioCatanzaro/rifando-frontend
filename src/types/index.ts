export type ConfirmationMethod = 'whatsapp' | 'upload' | 'mercadopago';
export type ReservationTtlMinutes = 30 | 60 | 360 | 1440;

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
  /** Último cambio de nombre de usuario (límite: uno cada 30 días). */
  username_changed_at?: string | null;
  is_admin?: boolean;
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
  confirmation_method: ConfirmationMethod;
  draw_unlocked: boolean;
  /** Comisión de Rifando (%) fijada al crear la rifa. Solo para el dueño. */
  app_fee_percent?: number;
  /** Meta de ganancia neta. Solo para el dueño. */
  target_amount?: number | null;
  /** Minutos que dura una reserva sin comprobante (sin Mercado Pago). */
  reservation_ttl_minutes: ReservationTtlMinutes;
  created_at: string;
  updated_at: string;
  stats?: {
    total: number;
    sold: number;
    reserved: number;
    /** Suma de lo vendido con promociones aplicadas. */
    revenue: number;
  };
}

export interface RaffleNumber {
  number: number;
  status: 'available' | 'reserved' | 'sold';
  /** Público: "Nombre I.". Dueño: nombre completo. */
  buyer_name: string | null;
  sold_at: string | null;
  /** Solo para el dueño de la rifa. */
  purchase_id?: string | null;
  /** Solo para el dueño: monto cobrado por este número. */
  sale_amount?: number | null;
}

/** Compra pendiente: números reservados juntos por un comprador. */
export interface Purchase {
  id: string;
  buyer_name: string;
  quantity: number;
  total: number;
  promotion_label: string | null;
  comprobante_url: string | null;
  /** null = no vence (tiene comprobante) */
  expires_at: string | null;
  created_at: string;
  numbers: number[];
}

export interface ReserveResult {
  reserved: number[];
  failed: number[];
  purchase_id: string | null;
  total: number;
  promotion_label?: string | null;
  expires_at: string | null;
}

export interface Prize {
  id: string;
  raffle_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  position: number;
  winner_number: number | null;
  substitute_numbers: number[];
  winner_buyer_name?: string | null;
  substitutes?: { number: number; buyer_name: string | null }[];
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

export interface DrawPayment {
  id: string;
  raffle_id: string;
  comprobante_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

/** Precio y cuenta para pagar el sorteo automático. null si la app no lo configuró. */
export interface DrawServiceInfo {
  price: number;
  alias: string;
  holder: string | null;
  bank: string | null;
}

export interface AdminDrawPayment extends DrawPayment {
  raffle_title: string;
  raffle_slug: string;
  owner_username: string;
  owner_email: string;
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

/** Estado de la vinculación de Mercado Pago del rifante. */
export interface MercadoPagoStatus {
  /** false si la app no tiene Mercado Pago configurado. */
  configured: boolean;
  linked: boolean;
  live_mode: boolean | null;
  linked_at: string | null;
}

export interface MercadoPagoCheckout {
  preference_id: string;
  init_point: string;
}

export type PurchaseStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';

/** Estado de una compra pagada con Mercado Pago, visto por el comprador. */
export interface MercadoPagoCheckoutStatus {
  purchase_status: PurchaseStatus;
  /** Estado del último pago en Mercado Pago (approved, rejected...). null si todavía no hay pago. */
  payment_status: string | null;
  payment_status_detail: string | null;
  numbers: number[];
  total: number;
  expires_at: string | null;
}

/** Pago recibido por Mercado Pago (historial del rifante). */
export interface MercadoPagoPayment {
  id: string;
  mp_payment_id: number;
  purchase_id: string;
  raffle_id: string;
  raffle_title: string;
  buyer_name: string;
  quantity: number;
  status: string;
  status_detail: string | null;
  /** confirmed | late | amount_mismatch | duplicate. null = sin acción de Rifando. */
  outcome: 'confirmed' | 'late' | 'amount_mismatch' | 'duplicate' | null;
  amount: number;
  fee_amount: number | null;
  net_amount: number | null;
  payment_method_id: string | null;
  live_mode: boolean;
  date_approved: string | null;
  created_at: string;
}

/** Rifa activa y pública para la home (`GET /api/raffles/explore`). */
export interface ExploreRaffle {
  id: string;
  slug: string;
  title: string;
  total_numbers: number;
  price_per_number: number;
  cover_icon: string;
  draw_mode: 'all_sold' | 'fixed_date' | 'first_event';
  draw_date: string | null;
  confirmation_method: ConfirmationMethod;
  created_at: string;
  sold: number;
  main_prize: { title: string; image_url: string | null } | null;
  prize_count: number;
  owner: { username: string; display_name: string | null; avatar_url: string | null };
}

export interface ExploreData {
  raffles: ExploreRaffle[];
  stats: { active_raffles: number; numbers_sold: number; organizers: number };
}

/** Porcentajes vigentes (`GET /api/fees`). */
export interface FeeConfig {
  app_fee_percent: number;
  /** Estimado con IVA. Solo para la calculadora. */
  mercadopago_fee_percent: number;
}

export interface FeePayment {
  id: string;
  raffle_id: string;
  amount: number;
  base_amount: number;
  fee_percent: number;
  comprobante_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

/** Comisión de Rifando por ventas sin Mercado Pago (`GET /api/raffles/:id/fee-payment`). */
export interface FeePaymentInfo {
  fee_percent: number;
  revenue: number;
  mercadopago_revenue: number;
  manual_revenue: number;
  due: number;
  paid: number;
  remaining: number;
  pending_payment: FeePayment | null;
  payments: FeePayment[];
  account: { alias: string; holder: string | null; bank: string | null } | null;
}

export interface AdminFeePayment extends FeePayment {
  raffle_title: string;
  raffle_slug: string;
  owner_username: string;
  owner_email: string;
}
