import { pool } from "../database/database.js";

type BudgetPeriod = 'monthly' | 'yearly';

class EnvelopeService {
  async getEnvelopesByAccount(accountNumber: string) {
    try {
      const query = `
      SELECT 
        id,
        name,
        allocated_amount,
        current_amount,
        budget_period,
        period_start,
        period_end,
        auto_reset,
        CURRENT_DATE > period_end AS expired
      FROM envelopes 
      WHERE account_number = $1
      ORDER BY period_end ASC, name ASC
    `;

      const result = await pool.query(query, [accountNumber]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async transferBetweenEnvelopes(data: {
    source_envelope_id: number,
    target_envelope_id: number,
    amount: number,
    account_number: string
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (data.source_envelope_id === data.target_envelope_id) {
        throw new Error("O envelope de origem e destino não podem ser o mesmo.");
      }

      if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        throw new Error("O valor da transferência deve ser maior que zero.");
      }

      const checkBalanceQuery = `
      SELECT current_amount, name 
      FROM envelopes 
      WHERE id = $1 AND account_number = $2`;

      const sourceRes = await client.query(checkBalanceQuery, [data.source_envelope_id, data.account_number]);

      if (sourceRes.rows.length === 0) {
        throw new Error("Envelope de origem não encontrado.");
      }

      const sourceEnvelope = sourceRes.rows[0];
      if (Number(sourceEnvelope.current_amount) < data.amount) {
        throw new Error(`Saldo insuficiente no envelope "${sourceEnvelope.name}".`);
      }

      const subtractQuery = `
      UPDATE envelopes 
      SET current_amount = current_amount - $1 
      WHERE id = $2 AND account_number = $3`;
      await client.query(subtractQuery, [data.amount, data.source_envelope_id, data.account_number]);

      const addQuery = `
      UPDATE envelopes 
      SET current_amount = current_amount + $1 
      WHERE id = $2 AND account_number = $3`;

      const targetRes = await client.query(addQuery, [data.amount, data.target_envelope_id, data.account_number]);

      if (targetRes.rowCount === 0) {
        throw new Error("Envelope de destino não encontrado nesta conta.");
      }

      const logQuery = `
      INSERT INTO transactions (account_number, description, amount, type, category, subcategory, envelope_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`;

      await client.query(logQuery, [
        data.account_number,
        `Transferência interna entre envelopes`,
        data.amount,
        'transfer',
        'Ajuste',
        'Envelope',
        data.target_envelope_id
      ]);

      await client.query('COMMIT');
      return { message: "Transferência realizada com sucesso!" };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


  async getBudgetPeriod(period: BudgetPeriod) {
    const now = new Date();

    if (period === 'monthly') {
      return {
        period_start: new Date(now.getFullYear(), now.getMonth(), 1),
        period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }

    return {
      period_start: new Date(now.getFullYear(), 0, 1),
      period_end: new Date(now.getFullYear(), 11, 31)
    };
  }

  async createEnvelope(data: {
    account_number: string;
    name: string;
    allocated_amount: number;
    budget_period?: BudgetPeriod;
    auto_reset?: boolean;
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const trimmedName = data.name?.trim();
      const budgetPeriod = data.budget_period ?? 'monthly';
      const autoReset = data.auto_reset ?? false;

      if (!trimmedName) {
        throw new Error('O nome do envelope é obrigatório.');
      }

      if (!['monthly', 'yearly'].includes(budgetPeriod)) {
        throw new Error('Período de orçamento inválido.');
      }

      if (!data.allocated_amount || isNaN(data.allocated_amount) || data.allocated_amount <= 0) {
        throw new Error('O valor alocado deve ser maior que zero.');
      }

      const { period_start, period_end } = await this.getBudgetPeriod(budgetPeriod);

      const accountQuery = `
      SELECT account_number, balance
      FROM accounts
      WHERE account_number = $1
      FOR UPDATE
    `;

      const accountRes = await client.query(accountQuery, [data.account_number]);

      if (accountRes.rows.length === 0) {
        throw new Error('Conta não encontrada.');
      }

      const account = accountRes.rows[0];

      const existingEnvelopeQuery = `
      SELECT id
      FROM envelopes
      WHERE account_number = $1
        AND LOWER(name) = LOWER($2)
    `;

      const existingEnvelopeRes = await client.query(existingEnvelopeQuery, [
        data.account_number,
        trimmedName
      ]);

      if (existingEnvelopeRes.rows.length > 0) {
        throw new Error('Já existe um envelope com esse nome nesta conta.');
      }

      const allocatedSumQuery = `
      SELECT COALESCE(SUM(current_amount), 0) AS total_allocated
      FROM envelopes
      WHERE account_number = $1
    `;

      const allocatedSumRes = await client.query(allocatedSumQuery, [data.account_number]);
      const totalAllocated = Number(allocatedSumRes.rows[0].total_allocated);
      const accountBalance = Number(account.balance);
      const availableToAllocate = accountBalance - totalAllocated;

      if (data.allocated_amount > availableToAllocate) {
        throw new Error(
          `Saldo insuficiente para criar o envelope. Disponível para alocação: R$ ${availableToAllocate.toFixed(2)}`
        );
      }

      const insertQuery = `
      INSERT INTO envelopes (
        account_number,
        name,
        allocated_amount,
        current_amount,
        budget_period,
        period_start,
        period_end,
        auto_reset
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

      const result = await client.query(insertQuery, [
        data.account_number,
        trimmedName,
        data.allocated_amount,
        data.allocated_amount,
        budgetPeriod,
        period_start,
        period_end,
        autoReset
      ]);

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getNextBudgetPeriod(period: 'monthly' | 'yearly', currentStart: Date) {
    const date = new Date(currentStart);

    if (period === 'monthly') {
      return {
        period_start: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        period_end: new Date(date.getFullYear(), date.getMonth() + 2, 0)
      };
    }

    return {
      period_start: new Date(date.getFullYear() + 1, 0, 1),
      period_end: new Date(date.getFullYear() + 1, 11, 31)
    };
  }

  async resetExpiredEnvelopes() {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const expiredEnvelopes = await client.query(`
      SELECT *
      FROM envelopes
      WHERE auto_reset = true
        AND period_end < CURRENT_DATE
      FOR UPDATE
    `);

      for (const envelope of expiredEnvelopes.rows) {
        await client.query(
          `
          INSERT INTO envelope_history (
            envelope_id,
            allocated_amount,
            current_amount,
            budget_period,
            period_start,
            period_end
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            envelope.id,
            envelope.allocated_amount,
            envelope.current_amount,
            envelope.budget_period,
            envelope.period_start,
            envelope.period_end
          ]
        );

        const { period_start, period_end } = this.getNextBudgetPeriod(
          envelope.budget_period,
          envelope.period_start
        );

        await client.query(
          `
          UPDATE envelopes
          SET current_amount = allocated_amount,
              period_start = $1,
              period_end = $2
          WHERE id = $3
        `,
          [period_start, period_end, envelope.id]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEnvelopeHistory(envelopeId: number) {
    const query = `
    SELECT
      id,
      envelope_id,
      allocated_amount,
      current_amount,
      budget_period,
      period_start,
      period_end,
      created_at
    FROM envelope_history
    WHERE envelope_id = $1
    ORDER BY period_start ASC
  `;

    const result = await pool.query(query, [envelopeId]);

    return result.rows;
  }

  
}

export { EnvelopeService }