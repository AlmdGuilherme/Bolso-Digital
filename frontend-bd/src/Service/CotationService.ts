export class CotationService {
  async convertCurrency(from: string, to: string, amount: number) {
    try {
      const response = await fetch(
        `https://economia.awesomeapi.com.br/json/last/${from}-${to}`,{
          headers: {
            'X-API-KEY':'096861d30a73782e29148c5112f8e078fc19771a6eac24b44924c7ab6e4c8131'
          }
        }
      );

      const data = await response.json();

      const key = `${from}${to}`;
      if (!data[key] || !data[key].bid) {
        throw new Error("Conversão indisponível");
      }

      const rate = Number(data[key].bid);

      return amount * rate;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao converter moeda!");
    }
  }
}