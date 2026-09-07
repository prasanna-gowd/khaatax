export interface User {
  id: string;
  name: string;
  email_or_phone: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface GroupMember {
  id: string;
  user_id: string;
  role: 'OWNER' | 'MEMBER';
  joined_at: string;
  user: User;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
  members: GroupMember[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  is_custom: boolean;
}

export type TransactionType = 'EXPENSE' | 'PAYMENT' | 'SETTLEMENT';
export type SplitType = '50_50' | 'FULL_AMOUNT' | 'CUSTOM';

export interface Transaction {
  id: string;
  group_id: string;
  created_by: string;
  paid_by: string;
  received_by?: string | null;
  amount: number;
  transaction_type: TransactionType;
  description: string;
  category_id: string;
  split_type: SplitType;
  split_details?: Record<string, number> | null;
  transaction_date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  category?: Category;
  payer?: User;
  receiver?: User;
  creator?: User;
}

export interface MemberSummary {
  user_id: string;
  name: string;
  email_or_phone: string;
  total_paid: number;
  total_consumed: number;
  net_position: number;
}

export interface GroupBalance {
  group_id: string;
  status: 'you_owe' | 'you_are_owed' | 'settled';
  amount: number;
  debtor_id?: string | null;
  creditor_id?: string | null;
  current_user_id: string;
  other_user_id?: string | null;
  other_user_name?: string | null;
  members: MemberSummary[];
}

export interface CategorySpending {
  category_name: string;
  icon: string;
  total_amount: number;
  percentage: number;
}

export interface SpendingTrend {
  date: string;
  amount: number;
}

export interface MemberContribution {
  user_id: string;
  user_name: string;
  total_paid: number;
  total_share: number;
  percentage: number;
}

export interface GroupAnalytics {
  total_expenses: number;
  my_contribution: number;
  other_member_contribution: number;
  current_balance: number;
  balance_status: 'you_owe' | 'you_are_owed' | 'settled';
  transaction_count: number;
  current_month_spending: number;
  category_breakdown: CategorySpending[];
  spending_trend: SpendingTrend[];
  member_contributions: MemberContribution[];
}
