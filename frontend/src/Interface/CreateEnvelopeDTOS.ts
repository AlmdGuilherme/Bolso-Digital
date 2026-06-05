interface CreateEnvelopeDTO {
  accountNumber: string;
  name: string;
  allocated_amount: number;
  budget_period: 'monthly' | 'yearly';
  auto_reset: boolean;
}

export type { CreateEnvelopeDTO }