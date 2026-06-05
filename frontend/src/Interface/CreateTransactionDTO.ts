interface CreateTransactionDTO {
  account_number: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  subcategory?: string;
  category_id?: number | null;
  subcategory_id?: number | null;
  envelope_id?: number | null;
  status?: "pending" | "completed" | "cancelled";
}

export type { CreateTransactionDTO }

