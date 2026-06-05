import { pool } from "../database/database.js";
import type { CreateTransactionDTO } from "../Interface/CreateTransactionDTO.js";
import * as DBQuery from '../database/queries.js'

export class TransactionService {
  async createTransaction(data: CreateTransactionDTO) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const status = data.status ?? 'completed';

      if (data.category_id && data.subcategory_id) {
        const validationQuery = `
        SELECT id
        FROM subcategories
        WHERE id = $1 AND category_id = $2
      `;

        const validationRes = await client.query(validationQuery, [
          data.subcategory_id,
          data.category_id,
        ]);

        if (validationRes.rows.length === 0) {
          throw new Error('A subcategoria não pertence à categoria informada.');
        }
      }

      if (status === 'completed' && data.type === 'expense' && data.envelope_id) {
        const envelopeQuery = `
        SELECT id, name, current_amount
        FROM envelopes
        WHERE id = $1 AND account_number = $2
        FOR UPDATE
      `;

        const envelopeRes = await client.query(envelopeQuery, [
          data.envelope_id,
          data.account_number,
        ]);

        if (envelopeRes.rows.length === 0) {
          throw new Error('Envelope não encontrado.');
        }

        const envelope = envelopeRes.rows[0];

        if (Number(envelope.current_amount) < data.amount) {
          throw new Error(`Saldo insuficiente no envelope "${envelope.name}".`);
        }

        const updateEnvelopeQuery = `
        UPDATE envelopes
        SET current_amount = current_amount - $1
        WHERE id = $2 AND account_number = $3
      `;

        await client.query(updateEnvelopeQuery, [
          data.amount,
          data.envelope_id,
          data.account_number,
        ]);
      }

      const res = await client.query(DBQuery.CREATE_TRASACTION, [
        data.account_number,
        data.description,
        data.amount,
        data.type,
        data.category ?? null,
        data.subcategory ?? null,
        data.category_id ?? null,
        data.subcategory_id ?? null,
        data.envelope_id ?? null,
        status,
      ]);

      if (status === 'completed') {
        const updateBalanceQuery =
          data.type === 'expense'
            ? 'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2'
            : 'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2';

        await client.query(updateBalanceQuery, [
          data.amount,
          data.account_number,
        ]);
      }

      await client.query('COMMIT');

      return res.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');

      if (error.code === '23503') {
        throw new Error('Categoria ou subcategoria inválida.');
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async getTransactionsByAccount(accountNumber: string) {
    const result = await pool.query(
      DBQuery.GET_TRANSACTIONS_BY_ACCOUNT,
      [accountNumber]
    );

    return result.rows;
  }

  async getDashboardData(accountNumber: string) {
    const result = await pool.query(DBQuery.GET_DASHBOARD_DATA, [accountNumber]);
    return result.rows;
  }

  async getBalanceAccountChart(accountNumber: string) {
    const [resBal, resInc, resExp, resSum] = await Promise.all([
      pool.query(DBQuery.GET_BALANCE_EVOLUTION, [accountNumber]),
      pool.query(DBQuery.GET_INCOME_EVOLUTION, [accountNumber]),
      pool.query(DBQuery.GET_EXPENSE_EVOLUTION, [accountNumber]),
      pool.query(DBQuery.GET_SUMMARY_EVOLUTION, [accountNumber])
    ]);

    const totals = { income: 0, expense: 0 };
    resSum.rows.forEach(row => {
      if (row.type === 'income') totals.income = parseFloat(row.total);
      if (row.type === 'expense') totals.expense = parseFloat(row.total);
    });

    return {
      balanceChart: {
        labels: resBal.rows.map(r => r.label),
        values: resBal.rows.map(r => parseFloat(r.value))
      },
      incomeChart: {
        labels: resInc.rows.map(r => r.label),
        values: resInc.rows.map(r => parseFloat(r.value))
      },
      expenseChart: {
        labels: resExp.rows.map(r => r.label),
        values: resExp.rows.map(r => parseFloat(r.value))
      },
      totals
    };
  }

  async getCategories() {
    const query = `
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `;

    const result = await pool.query(query);
    return result.rows;
  }

  async getSubcategoriesByCategory(categoryId: number) {
    const query = `
    SELECT id, name, category_id
    FROM subcategories
    WHERE category_id = $1
    ORDER BY name ASC
  `;

    const result = await pool.query(query, [categoryId]);
    return result.rows;
  }

  async getDailyExpenses(account_number: string) {
    const result = await pool.query(DBQuery.GET_DAILY_EXPENSES, [account_number])
    return result.rows;
  }


  async confirmPendingTransaction(transactionId: number, accountNumber: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const transactionRes = await client.query(
        `
        SELECT id, account_number, amount, type, status
        FROM transactions
        WHERE id = $1 AND account_number = $2
        FOR UPDATE
      `,
        [transactionId, accountNumber]
      );

      if (transactionRes.rows.length === 0) {
        throw new Error('Transação não encontrada.');
      }

      const transaction = transactionRes.rows[0];

      if (transaction.status !== 'pending') {
        throw new Error('Essa transação não está pendente.');
      }

      const updateBalanceQuery =
        transaction.type === 'expense'
          ? 'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2'
          : 'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2';

      await client.query(updateBalanceQuery, [
        transaction.amount,
        accountNumber,
      ]);

      const updateTransactionRes = await client.query(
        `
        UPDATE transactions
        SET status = 'completed'
        WHERE id = $1 AND account_number = $2
        RETURNING *
      `,
        [transactionId, accountNumber]
      );

      await client.query('COMMIT');

      return updateTransactionRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelPendingTransaction(transactionId: number, accountNumber: string) {
    const result = await pool.query(
      `
      UPDATE transactions
      SET status = 'cancelled'
      WHERE id = $1
      AND account_number = $2
      AND status = 'pending'
      RETURNING *
    `,
      [transactionId, accountNumber]
    );

    if (result.rows.length === 0) {
      throw new Error('Transação pendente não encontrada.');
    }

    return result.rows[0];
  }

  async getPendingTransactions(accountNumber: string) {
    const result = await pool.query(
      `
      SELECT *
      FROM transactions
      WHERE account_number = $1
      AND status = 'pending'
      ORDER BY created_at DESC
    `,
      [accountNumber]
    );

    return result.rows;
  }

  async addReceipt(transactionId: string, accountNumber: string, imageUri: string) {
    const transactionRes = await pool.query(
      `
    SELECT id
    FROM transactions
    WHERE id = $1
    AND account_number = $2
    AND type = 'expense'
    `,
      [transactionId, accountNumber]
    );

    if (transactionRes.rows.length === 0) {
      throw new Error("Despesa não encontrada.");
    }

    const result = await pool.query(
      `
    INSERT INTO transaction_receipts (
      transaction_id,
      image_uri
    )
    VALUES ($1, $2)
    RETURNING *
    `,
      [transactionId, imageUri]
    );

    return result.rows[0];
  }

  async getReceiptsByTransaction(transactionId: string, accountNumber: string) {
    const transactionRes = await pool.query(
      `
    SELECT id
    FROM transactions
    WHERE id = $1
    AND account_number = $2
    `,
      [transactionId, accountNumber]
    );

    if (transactionRes.rows.length === 0) {
      throw new Error("Transação não encontrada.");
    }

    const result = await pool.query(
      `
    SELECT *
    FROM transaction_receipts
    WHERE transaction_id = $1
    ORDER BY created_at DESC
    `,
      [transactionId]
    );

    return result.rows;
  }

  async deleteReceipt(receiptId: string, accountNumber: string) {
    const result = await pool.query(
      `
    DELETE FROM transaction_receipts tr
    USING transactions t
    WHERE tr.transaction_id = t.id
    AND tr.id = $1
    AND t.account_number = $2
    RETURNING tr.*
    `,
      [receiptId, accountNumber]
    );

    if (result.rows.length === 0) {
      throw new Error("Recibo não encontrado.");
    }

    return result.rows[0];
  }

  async detectFixedExpenses(accountNumber: string) {
    const result = await pool.query(DBQuery.GET_CONCLUDED_EXPENSES, [
      accountNumber,
    ]);

    const expenses = result.rows;

    const groupedExpenses = new Map<string, any[]>();

    for (const expense of expenses) {
      const description = String(expense.description || "")
        .trim()
        .toLowerCase();

      if (!description) continue;

      if (!groupedExpenses.has(description)) {
        groupedExpenses.set(description, []);
      }

      groupedExpenses.get(description)?.push(expense);
    }

    const fixedExpenses = [];

    for (const [description, items] of groupedExpenses.entries()) {
      const months = new Set(
        items.map((item) => {
          const date = new Date(item.created_at);
          return `${date.getFullYear()}-${date.getMonth() + 1}`;
        })
      );

      if (months.size < 2) continue;

      const amounts = items.map((item) => Number(item.amount));
      const averageAmount =
        amounts.reduce((sum, value) => sum + value, 0) / amounts.length;

      const similarAmounts = amounts.filter((amount) => {
        const difference = Math.abs(amount - averageAmount);
        return difference <= averageAmount * 0.1;
      });

      const confidence =
        similarAmounts.length === amounts.length
          ? "alta"
          : similarAmounts.length >= 2
            ? "média"
            : "baixa";

      if (confidence === "baixa") continue;

      fixedExpenses.push({
        description: items[0].description,
        category: items[0].category,
        subcategory: items[0].subcategory,
        averageAmount: Number(averageAmount.toFixed(2)),
        occurrences: items.length,
        monthsDetected: months.size,
        confidence,
        lastOccurrence: items[0].created_at,
      });
    }

    return fixedExpenses.sort((a, b) => b.occurrences - a.occurrences);
  }

  async exportTransactionsCSV(accountNumber: string) {
    const result = await pool.query(
      DBQuery.GET_TRANSACTIONS_BY_ACCOUNT,
      [accountNumber]
    );

    const transactions = result.rows;

    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Subcategoria',
      'Tipo',
      'Valor',
      'Status',
    ];

    const rows = transactions.map((transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString('pt-BR');
      const type = transaction.type === 'expense' ? 'Despesa' : 'Receita';

      return [
        date,
        transaction.description || '',
        transaction.category || '',
        transaction.subcategory || '',
        type,
        String(Math.abs(Number(transaction.amount))).replace('.', ','),
        transaction.status || '',
      ];
    });

    const csv = [
      headers.join(';'),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(';')
      ),
    ].join('\n');

    return csv;
  }
}