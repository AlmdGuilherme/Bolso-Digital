// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

export class GamingBadgeService {
  async getAccountAchievements(accountNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${accountNumber}/achievements`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar conquistas');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar conquistas:', error.message);
      throw error;
    }
  }

  async getAllAchievements(accountNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${accountNumber}/achievements/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar badges');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar badges:', error.message);
      throw error;
    }
  }

  async unlockAchievement(accountNumber: string, achievementCode: string) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${accountNumber}/achievements/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ achievementCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao desbloquear conquista');
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao desbloquear conquista:', error.message);
      throw error;
    }
  }
}