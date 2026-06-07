export class CryptoService {
  async getCryptosPrice(cryptoIds: string[]) {
    const ids = cryptoIds.join(",")
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`
    )

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Erro ao buscar preço das criptomoedas!")
    }

    return cryptoIds.map((cryptoId) => {
      const crypto = data[cryptoId]
      if (!crypto) {
        return null
      }
      return {
        id: cryptoId,
        price: Number(crypto.brl),
        variation: Number(crypto.brl_24h_change ?? 0)
      }
    }).filter(Boolean)
  }

  async getCriptoWeek(cryptoId: string) {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=brl&days=7`
    )

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Erro ao buscar histórico da criptomoeda!")
    }
    return data.prices.map((item: number[]) => item[1])
  }

  async getUserCryptosList(id: string) {
    try {
      const response = await fetch(``)

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar criptomoedas salvas!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao buscar criptomoedas salvas: ", error.message)
      throw error
    }

  }
}