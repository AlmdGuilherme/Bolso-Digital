// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

export class FraudAlertService {
  async getFraudAlerts(accountNumber: string) {
    try {
      const response = await fetch(
        `${baseUrl}/transactions/fraud-alerts/${accountNumber}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Erro ao buscar alertas de fraude'
        );
      }

      return data;
    } catch (error: any) {
      console.error(
        'Erro ao buscar alertas de fraude:',
        error.message
      );

      throw error;
    }
  }
}