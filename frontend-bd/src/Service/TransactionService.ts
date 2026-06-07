import type { CreateTransactionDTO } from "../Interface/CreateTransactionDTO";
import { GamingBadgeService } from "./GamingBadgeService";

// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

export class TransactionService {
  async createTransaction(data: CreateTransactionDTO) {
    try {
      const response = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Erro ao criar transação');
      }

      return responseData;
    } catch (error: any) {
      console.error('Erro ao criar transação:', error.message);
      throw error;
    }
  }


  public async GetChartData(accountNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/transactions/dashboard/${accountNumber}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar dados do gráfico!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao buscar dados do gráfico: ", error.message)
      throw error
    }
  }

  async getCategories() {
    try {
      const response = await fetch(`${baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar categorias');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error.message);
      throw error;
    }
  }

  async getSubcategoriesByCategory(categoryId: number) {
    try {
      const response = await fetch(`${baseUrl}/categories/${categoryId}/subcategories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar subcategorias');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar subcategorias:', error.message);
      throw error;
    }
  }

  async getDailyExpenses(accountNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/transactions/daily-expenses/${accountNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar gastos diários")
      }
      return data
    } catch (error: any) {
      console.error("Erro ao buscar gastos diários:", error.message)
      throw error
    }
  }

  async addReceipt(transactionId: string, accountNumber: string, imageUri: string) {
    try {
      const response = await fetch(`${baseUrl}/transactions/${transactionId}/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber,
          imageUri,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar recibo');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao salvar recibo:', error.message);
      throw error;
    }
  }

  async getReceiptsByTransaction(transactionId: string, accountNumber: string) {
    try {
      const response = await fetch(
        `${baseUrl}/transactions/${transactionId}/receipts?accountNumber=${accountNumber}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar recibos');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar recibos:', error.message);
      throw error;
    }
  }

  async deleteReceipt(receiptId: string, accountNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/transactions/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao remover recibo');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao remover recibo:', error.message);
      throw error;
    }
  }

  async getTransactionsByAccount(accountNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/transactions/account/${accountNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar histórico de transações');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar histórico de transações:', error.message);
      throw error;
    }
  }

  async detectFixedExpenses(accountNumber: string) {
    try {
      const response = await fetch(
        `${baseUrl}/transactions/fixed-expenses/${accountNumber}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao detectar despesas fixas');
      }

      if (Array.isArray(data) && data.length > 0) {
        try {
          const gamingBadgeService = new GamingBadgeService();
          await gamingBadgeService.unlockAchievement(accountNumber, 'FIXED_EXPENSE');
        } catch (error) {
          console.log('Badge de despesa fixa já desbloqueada ou não aplicada.');
        }
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao detectar despesas fixas:', error.message);
      throw error;
    }
  }

  async exportTransactionsCSV(accountNumber: string) {
    try {
      const response = await fetch(
        `${baseUrl}/transactions/export/${accountNumber}`,
        {
          method: 'GET',
        }
      );

      const csv = await response.text();

      if (!response.ok) {
        let message = 'Erro ao exportar transações';

        try {
          const errorData = JSON.parse(csv);
          message = errorData.message || message;
        } catch { }

        throw new Error(message);
      }

      return csv;
    } catch (error: any) {
      console.error('Erro ao exportar CSV:', error.message);
      throw error;
    }
  }

  async getSuggestedGeofences(accountNumber: string) {
    try {
      const response = await fetch(
        `${baseUrl}/accounts/${accountNumber}/suggested-geofences`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar geofences sugeridos');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar geofences sugeridos:', error.message);
      throw error;
    }
  }
}