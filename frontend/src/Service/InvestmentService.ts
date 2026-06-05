export type InvestmentType = "Ação" | "FII" | "Tesouro" | "Cripto";

export type InvestmentAsset = {
  symbol: string;
  name: string;
  type: InvestmentType;
  price: number;
  variation: number;
  dividend: number;
  history: number[];
};

export class InvestmentService {
  private token = "fDEMvE1e6opzE3C8yt67dj";

  async getAsset(symbol: string, type: InvestmentType): Promise<InvestmentAsset> {
    try {
      const response = await fetch(
        `https://brapi.dev/api/quote/${symbol}?range=1mo&interval=1d`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok || !data.results?.[0]) {
        throw new Error(data.message || `Erro ao buscar ${symbol}`);
      }

      const asset = data.results[0];
      return {
        symbol: asset.symbol,
        name: asset.longName || asset.shortName || asset.symbol,
        type,
        price: Number(asset.regularMarketPrice ?? 0),
        variation: Number(asset.regularMarketChangePercent ?? 0),
        dividend: 0,
        history: asset.historicalDataPrice?.map((item: any) => Number(item.close ?? 0)) ?? [],
      };
    } catch (error: any) {
      console.error("Erro ao buscar criptomoedas: ", error.message)
      throw error
    }
  }

  async getAssets(): Promise<InvestmentAsset[]> {
    const assets = await Promise.all([
      this.getAsset("PETR4", "Ação"),
      this.getAsset("VALE3", "Ação"),
      this.getAsset("MXRF11", "FII"),
    ]);

    return [
      ...assets,
      {
        symbol: "TESOURO SELIC",
        name: "Tesouro Selic 2029",
        type: "Tesouro",
        price: 15320.45,
        variation: 0.08,
        dividend: 0,
        history: [15280, 15291, 15300, 15306, 15314, 15320.45],
      },
    ];
  }
}