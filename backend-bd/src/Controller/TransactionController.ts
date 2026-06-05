import type { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '../Service/TransactionSerivce.js';
import type { CreateTransactionDTO } from '../Interface/CreateTransactionDTO.js';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async CreateTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as CreateTransactionDTO;
      const transaction = await this.transactionService.createTransaction(data);

      return reply.status(201).send(transaction);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async GetTransactionsByAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const transactions = await this.transactionService.getTransactionsByAccount(
        accountNumber
      );

      return reply.status(200).send(transactions);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao buscar histórico de transações.",
      });
    }
  }

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };
      const data = await this.transactionService.getDashboardData(accountNumber);

      return reply.send(data);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async GetAccountBalanceChart(request: FastifyRequest, reply: FastifyReply) {
    const { accountNumber } = request.params as { accountNumber: string }
    try {
      const result = await this.transactionService.getBalanceAccountChart(accountNumber)
      return reply.status(200).send(result)
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao buscar dados do saldo!"
      })
    }
  }

  async GetCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await this.transactionService.getCategories();
      return reply.status(200).send(categories);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async GetSubcategoriesByCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { categoryId } = request.params as { categoryId: string };
      const subcategories = await this.transactionService.getSubcategoriesByCategory(Number(categoryId));
      return reply.status(200).send(subcategories);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async GetDailyExpenses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string }
      const dailyExpenses = await this.transactionService.getDailyExpenses(accountNumber)
      return reply.status(200).send(dailyExpenses)
    } catch (error: any) {
      return reply.status(400).send({ message: error.message })
    }
  }

  async ConfirmPendingTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { transactionId } = request.params as { transactionId: string };
      const { accountNumber } = request.body as { accountNumber: string };

      const transaction = await this.transactionService.confirmPendingTransaction(
        Number(transactionId),
        accountNumber
      );

      return reply.status(200).send(transaction);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async CancelPendingTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { transactionId } = request.params as { transactionId: string };
      const { accountNumber } = request.body as { accountNumber: string };

      const transaction = await this.transactionService.cancelPendingTransaction(
        Number(transactionId),
        accountNumber
      );

      return reply.status(200).send(transaction);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async GetPendingTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as {
        accountNumber: string;
      };

      const transactions = await this.transactionService.getPendingTransactions(
        accountNumber
      );

      return reply.status(200).send(transactions);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message,
      });
    }
  }

  async AddReceipt(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { transactionId } = request.params as { transactionId: string };
      const { accountNumber, imageUri } = request.body as {
        accountNumber: string;
        imageUri: string;
      };

      const receipt = await this.transactionService.addReceipt(
        transactionId,
        accountNumber,
        imageUri
      );

      return reply.status(201).send(receipt);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao adicionar recibo.",
      });
    }
  }

  async GetReceiptsByTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { transactionId } = request.params as { transactionId: string };
      const { accountNumber } = request.query as { accountNumber: string };

      const receipts = await this.transactionService.getReceiptsByTransaction(
        transactionId,
        accountNumber
      );

      return reply.status(200).send(receipts);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao buscar recibos.",
      });
    }
  }

  async DeleteReceipt(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { receiptId } = request.params as { receiptId: string };
      const { accountNumber } = request.body as { accountNumber: string };

      const receipt = await this.transactionService.deleteReceipt(
        receiptId,
        accountNumber
      );

      return reply.status(200).send(receipt);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao remover recibo.",
      });
    }
  }

  async DetectFixedExpenses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const fixedExpenses = await this.transactionService.detectFixedExpenses(
        accountNumber
      );

      return reply.status(200).send(fixedExpenses);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || "Erro ao detectar despesas fixas.",
      });
    }
  }

  async ExportTransactionsCSV(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { accountNumber } = request.params as { accountNumber: string };

      const csv = await this.transactionService.exportTransactionsCSV(accountNumber);

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header(
          'Content-Disposition',
          'attachment; filename="transacoes-bolso-digital.csv"'
        )
        .status(200)
        .send(csv);
    } catch (error: any) {
      return reply.status(400).send({
        message: error.message || 'Erro ao exportar transações.',
      });
    }
  }
}