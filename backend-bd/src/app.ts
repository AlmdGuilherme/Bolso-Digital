import fastifyJwt from "@fastify/jwt"
import fastify from "fastify"
import { AuthController } from "./Controller/AuthController.js"
import { AccountController } from "./Controller/AccountController.js"
import { SMSController } from "./Controller/SMSController.js"
import { TransactionController } from "./Controller/TransactionController.js"
import { EnvelopeController } from "./Controller/EnvelopeController.js"
import { EnvelopeService } from "./Service/EnvelopeService.js"
import { GoalController } from "./Controller/GoalController.js"
import { GoalService } from "./Service/GoalService.js"
import cron from 'node-cron';
import { GamingBadgeController } from "./Controller/GamingBadgeController.js"

class App {
  public app: fastify.FastifyInstance
  constructor() {
    this.app = fastify({ logger: true })
    this.config()
    this.routes()
    this.startCronJobs();
    this.app.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Servidor rodando em: ${address}`);
    });

  }

  private config() {
    this.app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'fallback_secret_apenas_para_dev'
    })

    this.app.decorate("authenticate", async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });
  }

  private startCronJobs() {
    const envelopeService = new EnvelopeService();
    const goalService = new GoalService();

    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('Verificando envelopes expirados...');
        await envelopeService.resetExpiredEnvelopes();
        console.log('Envelopes resetados com sucesso.');

        console.log('Processando depósitos automáticos das metas...');
        await goalService.processAutomaticGoalDeposits();
        console.log('Depósitos automáticos das metas processados com sucesso.');
      } catch (error) {
        console.error('Erro ao executar rotinas automáticas:', error);
      }
    });
  }

  async listen(port: number) {
    try {
      await this.app.listen({ port: port, host: '0.0.0.0' });
      console.log(`O Servidor está rodando na porta: ${port}`)
    } catch (err) {
      this.app.log.error(err);
      process.exit(1);
    }
  }

  routes() {
    const accountController = new AccountController();
    const authController = new AuthController();
    const smsController = new SMSController();
    const transactionController = new TransactionController();
    const envelopeController = new EnvelopeController();
    const goalController = new GoalController();
    const gamingBadgeController = new GamingBadgeController();

    this.app.get('/', async (request, reply) => {
      return { ok: true }
    })

    this.app.post('/create-user', async (request, reply) => {
      await accountController.CreateUser(request, reply);
    })

    this.app.get('/user/:id', async (request, reply) => {
      await accountController.ReadUser(request, reply);
    })

    this.app.get('/user-account/:id', async (request, reply) => {
      await accountController.ReadUserAccount(request, reply);
    })

    this.app.put('/update-user/:id', async (request, reply) => {
      await accountController.UpdateUser(request, reply);
    })

    this.app.put('/update-user-pin/:id', async (request, reply) => {
      await accountController.UpdatePin(request, reply);
    })

    this.app.delete("/delete-user/:id", async (request, reply) => {
      await accountController.DeleteUser(request, reply);
    })

    this.app.post('/login', async (request, reply) => {
      await authController.login(request, reply);
    })

    this.app.put('/logout',
      { preHandler: [(this.app as any).authenticate] },
      async (request, reply) => {
        await authController.logout(request, reply);
      })

    this.app.post('/phone/send-verification-code', async (request, reply) => {
      await smsController.sendVerificationCode(request, reply);
    })

    this.app.post('/phone/resend-verification-code', async (request, reply) => {
      await smsController.resendVerificationCode(request, reply);
    })

    this.app.post('/phone/validate-code', async (request, reply) => {
      await smsController.validateCode(request, reply);
    })

    this.app.post('/transactions', async (request, reply) => {
      await transactionController.CreateTransaction(request, reply);
    });

    this.app.get('/transactions/account/:accountNumber', async (request, reply) => {
      await transactionController.GetTransactionsByAccount(request, reply);
    });

    this.app.get('/transactions/dashboard/:accountNumber', async (request, reply) => {
      await transactionController.GetAccountBalanceChart(request, reply)
    })

    this.app.get('/transactions/daily-expenses/:accountNumber', async (request, reply) => {
      await transactionController.GetDailyExpenses(request, reply)
    })

    this.app.patch('/transactions/:transactionId/confirm', async (request, reply) => {
      await transactionController.ConfirmPendingTransaction(request, reply)
    })

    this.app.patch('/transactions/:transactionId/cancel', async (request, reply) => {
      await transactionController.CancelPendingTransaction(request, reply)
    });

    this.app.get('/transactions/pending/:accountNumber', async (request, reply) => {
      await transactionController.GetPendingTransactions(request, reply);
    });

    this.app.post('/transactions/:transactionId/receipts', async (request, reply) => {
      await transactionController.AddReceipt(request, reply);
    });

    this.app.get('/transactions/:transactionId/receipts', async (request, reply) => {
      await transactionController.GetReceiptsByTransaction(request, reply);
    });

    this.app.delete('/transactions/receipts/:receiptId', async (request, reply) => {
      await transactionController.DeleteReceipt(request, reply);
    });

    this.app.get('/transactions/fixed-expenses/:accountNumber', async (request, reply) => {
      await transactionController.DetectFixedExpenses(request, reply);
    });

    this.app.get('/transactions/export/:accountNumber', async (request, reply) => {
      await transactionController.ExportTransactionsCSV(request, reply);
    });

    this.app.get('/categories', async (request, reply) => {
      await transactionController.GetCategories(request, reply);
    });

    this.app.get('/categories/:categoryId/subcategories', async (request, reply) => {
      await transactionController.GetSubcategoriesByCategory(request, reply);
    });

    this.app.get('/accounts/:accountNumber/envelopes', async (request, reply) => {
      await envelopeController.GetEnvelopesByAccount(request, reply)
    })

    this.app.post('/accounts/:accountNumber/envelopes/create', async (request, reply) => {
      await envelopeController.CreateEnvelope(request, reply)
    })

    this.app.post('/accounts/:accountNumber/envelopes/transfer', async (request, reply) => {
      await envelopeController.TransferBetweenEnvelopes(request, reply)
    })

    this.app.get('/accounts/:envelopeId/history', async (request, reply) => {
      await envelopeController.GetEnvelopeHistory(request, reply)
    })

    this.app.post('/accounts/goals/:accountNumber/create', async (request, reply) => {
      await goalController.CreateGoal(request, reply)
    })

    this.app.get('/accounts/goals/:accountNumber', async (request, reply) => {
      await goalController.GetGoalsByAccount(request, reply)
    })

    this.app.post('/accounts/goals/:goalId/deposit', async (requst, reply) => {
      await goalController.DepositToGoal(requst, reply)
    })

    this.app.delete('/accounts/goals/:goalId/delete', async (request, reply) => {
      await goalController.DeleteGoal(request, reply)
    })

    this.app.get('/accounts/:accountNumber/achievements', async (request, reply) => {
      await gamingBadgeController.GetAccountAchievements(request, reply);
    });

    this.app.get('/accounts/:accountNumber/achievements/all', async (request, reply) => {
      await gamingBadgeController.GetAllAchievements(request, reply);
    });

    this.app.post('/accounts/:accountNumber/achievements/unlock', async (request, reply) => {
      await gamingBadgeController.UnlockAchievement(request, reply);
    });
  }
}

export { App }