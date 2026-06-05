import type { CreateUserDTO } from "../Interface/CreateUserDTO"

// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24


class UserService {
  public async CreateUser(userData: CreateUserDTO) {
    try {
      const response = await fetch(`${baseUrl}/create-user `, {
        method: "POST",
        headers: {
          'Content-Type': "application/json"
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar conta!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao realizar criar conta: ", error.message)
      throw error
    }
  }

  public async Login(email: string, password?: string, pin?: string) {
    try {
      const body: any = { email }

      if (password) {
        body.password = password
      }

      if (pin) {
        body.pin = pin
      }

      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao realizar login")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao realizar login: ", error.message)
      throw error
    }
  }
}

export { UserService }