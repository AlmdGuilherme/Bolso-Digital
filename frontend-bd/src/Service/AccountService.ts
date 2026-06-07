import { jwtDecode } from "jwt-decode";

// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

class AccountService {
  public getUserAccount = async (token: string) => {
    try {
      const decodedToken: any = jwtDecode(token)
      if (!token) return
      const userId = decodedToken.sub
      const response = await fetch(`${baseUrl}/user-account/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
    
      console.log('getUserAccount response:', data);

      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar dados da conta!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao buscar dados da conta: ", error.message)
      throw error
    }
  }

  public UpdateAccountPin = async (id: string, pin: string) => {
    try {
      const response = await fetch(`${baseUrl}/update-user-pin/${id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin: pin.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar PIN do usuário!");
      }

      return data;
    } catch (error: any) {
      console.error("Erro ao atualizar PIN: ", error.message);
      throw error;
    }
  }
}

export { AccountService }