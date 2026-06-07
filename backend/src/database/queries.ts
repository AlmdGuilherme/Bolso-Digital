import { supabase } from './database.js';

export const ADDRESS_INTSERT = async (addressData: {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string | number;
  complement: string | null | undefined;
}) => {
  return await supabase
    .from('address')
    .insert([addressData])
    .select('id')
    .single();
};
export const USER_INSERT = async (userData: {
  name: string;
  surname: string;
  birth_date: string;
  cpf: string;
  address_id: any;
}) => {
  return await supabase
    .from('users')
    .insert([userData])
    .select('id')
    .single();
};

export const ACCOUNT_INSERT = async (accountData: {
  account_number: any;
  email: string;
  password: string;
  pin: string;
  phone: string;
  user_id: any;
}) => {
  return await supabase
    .from('accounts')
    .insert([accountData]);
};

export const VERIFY_EMAIL = async (email: string) => {
  return await supabase
    .from('accounts')
    .select('email')
    .eq('email', email);
};

export const VERIFY_CPF = async (cpf: string) => {
  return await supabase
    .from('users')
    .select('cpf')
    .eq('cpf', cpf);
};

export const VERIFY_PHONE = async (phone: string) => {
  return await supabase
    .from('accounts')
    .select('phone')
    .eq('phone', phone);
};

export const LOGIN_QUERY = async (email: string) => {
  return await supabase
    .from('accounts')
    .select('user_id, email, password, pin, users ( name )')
    .eq('email', email)
    .single();
};

export const GET_USER = async (userId: number) => {
  return await supabase
    .from('users')
    .select('name, surname, cpf, accounts ( email )')
    .eq('id', userId)
    .single();
};

export const GET_USER_DATA = async (userId: number) => {
  return await supabase
    .from('users')
    .select('id, name, surname, cpf, accounts ( email, password, pin, phone, account_number, balance )')
    .eq('id', userId)
    .single();
};

export const GET_USER_ACCOUNT = async (userId: number) => {
  return await supabase
    .from('users')
    .select('id, name, surname, cpf, accounts ( email, account_number, balance, phone )')
    .eq('id', userId)
    .single();
};

export const UPDATE_USER_DATA = async (
  userId: number,
  updatedData: { name: string; surname: string; cpf: string }
) => {
  return await supabase
    .from('users')
    .update(updatedData)
    .eq('id', userId);
};

export const UPDATE_ACCOUNT_DATA = async (
  userId: number,
  updatedData: { email: string; password?: string; pin?: string; phone: string }
) => {
  return await supabase
    .from('accounts')
    .update(updatedData)
    .eq('user_id', userId);
};

export const DELETE_USER = async (userId: number) => {
  return await supabase
    .from('users')
    .delete()
    .eq('id', userId)
    .select('address_id')
    .single();
};

export const DELETE_ADDRESS = async (addressId: number) => {
  return await supabase
    .from('address')
    .delete()
    .eq('id', addressId);
};

export const UPDATE_SESSION_QUERY = async (
  accountId: number,
  tokenData: { refresh_token: string; token_expires_at: string }
) => {
  return await supabase
    .from('accounts')
    .update(tokenData)
    .eq('id', accountId);
};

export const REMOVE_SESSION_QUERY = async (accountId: number) => {
  return await supabase
    .from('accounts')
    .update({ refresh_token: null, token_expires_at: null })
    .eq('id', accountId);
};

export const UPSERT_VERIFICATION = async (verificationData: {
  phone: string;
  code: string;
  expires_at: string;
}) => {
  return await supabase
    .from('phone_verifications')
    .upsert(
      {
        phone: verificationData.phone,
        code: verificationData.code,
        expires_at: verificationData.expires_at,
        created_at: new Date().toISOString()
      },
      { onConflict: 'phone' }
    );
};

export const VERIFY_CODE = async (phone: string) => {
  return await supabase
    .from('phone_verifications')
    .select('code')
    .eq('phone', phone);
};

export const DELETE_SMS_CODE = async (phone: string) => {
  return await supabase
    .from('phone_verifications')
    .delete()
    .eq('phone', phone);
};

export const DOES_PHONE_EXISTS = async (phone: string) => {
  return await supabase
    .from('accounts')
    .select('id')
    .eq('phone', phone);
};

export const GET_DASHBOARD_DATA = async (accountNumber: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await supabase
    .rpc('get_dashboard_data_custom', {
      p_account_number: accountNumber,
      p_start_date: thirtyDaysAgo.toISOString()
    });
};

export const GET_BALANCE_EVOLUTION = async (accountNumber: string) => {
  return await supabase
    .rpc('get_balance_evolution_custom', { p_account_number: accountNumber });
};

export const GET_INCOME_EVOLUTION = async (accountNumber: string) => {
  return await supabase
    .rpc('get_income_evolution_custom', { p_account_number: accountNumber });
};

export const GET_EXPENSE_EVOLUTION = async (accountNumber: string) => {
  return await supabase
    .rpc('get_expense_evolution_custom', { p_account_number: accountNumber });
};

export const GET_SUMMARY_EVOLUTION = async (accountNumber: string) => {
  return await supabase
    .from('transactions')
    .select('type, amount')
    .eq('account_number', accountNumber);
};

export const CREATE_TRASACTION = async (transactionData: {
  account_number: string;
  description: string;
  amount: number;
  type: string;
  category: string | null;
  subcategory: string | null;
  category_id: number | null;
  subcategory_id: number | null;
  envelope_id: number | null;
  status: string;
}) => {
  return await supabase
    .from('transactions')
    .insert([transactionData])
    .select('*');
};

export const GET_DAILY_EXPENSES = async (accountNumber: string) => {
  return await supabase
    .rpc('get_daily_expenses_custom', { p_account_number: accountNumber });
};

export const GET_TRANSACTIONS_BY_ACCOUNT = async (accountNumber: string) => {
  return await supabase
    .from('transactions')
    .select('*, transaction_receipts(id)')
    .eq('account_number', accountNumber)
    .order('created_at', { ascending: false });
};

export const GET_CONCLUDED_EXPENSES = async (accountNumber: string) => {
  return await supabase
    .from('transactions')
    .select('id, description, amount, category, subcategory, created_at')
    .eq('account_number', accountNumber)
    .eq('type', 'expense')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
};

export const INSERT_TRANSACTION_LOCATION = async (locationData: {
  transaction_id: any;
  latitude: number;
  longitude: number;
  location_name: string | null;
}) => {
  return await supabase
    .from('transaction_locations')
    .insert([locationData]);
};

export const GET_SUGGESTED_GEOFENCES = async (accountNumber: string) => {
  return await supabase
    .rpc('get_suggested_geofences_custom', { p_account_number: accountNumber });
};

export const GET_RECENT_TRANSACTIONS_WITH_LOCATION = async (
  accountNumber: string,
  transactionId: number
) => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  return await supabase
    .from('transactions')
    .select('id, created_at, transaction_locations(latitude, longitude)')
    .eq('account_number', accountNumber)
    .neq('id', transactionId)
    .eq('type', 'expense')
    .gte('created_at', fifteenMinutesAgo);
};

export const CREATE_FRAUD_ALERT = async (alertData: {
  account_number: string;
  transaction_id: number;
  compared_transaction_id: number;
  distance_km: number;
  time_difference_minutes: number;
  message: string;
}) => {
  return await supabase
    .from('fraud_alerts')
    .insert([alertData]);
};

export const CHECK_FRAUD_ALERT_EXISTS = async (
  transactionId: number,
  comparedTransactionId: number
) => {
  return await supabase
    .from('fraud_alerts')
    .select('id')
    .eq('transaction_id', transactionId)
    .eq('compared_transaction_id', comparedTransactionId)
    .limit(1);
};

export const GET_FRAUD_ALERTS = async (accountNumber: string) => {
  return await supabase
    .from('fraud_alerts')
    .select('*')
    .eq('account_number', accountNumber)
    .order('created_at', { ascending: false });
};