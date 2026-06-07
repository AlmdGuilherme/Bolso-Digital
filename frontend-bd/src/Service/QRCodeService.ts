// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

export class QRCodeService {
  async getPendingTransactions(accountNumber: string) {
    const response = await fetch(
      `${baseUrl}/transactions/pending/${accountNumber}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erro ao buscar transações pendentes."
      );
    }

    return data;
  }

  async confirmPendingTransaction(
    transactionId: number,
    accountNumber: string
  ) {
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}/confirm`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountNumber }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erro ao confirmar transação."
      );
    }

    return data;
  }

  async cancelPendingTransaction(
    transactionId: number,
    accountNumber: string
  ) {
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountNumber }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erro ao cancelar transação."
      );
    }

    return data;
  }
}