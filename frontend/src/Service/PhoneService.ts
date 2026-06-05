// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

class PhoneService {
  public async SendSMSVerification(phoneNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/phone/send-verification-code`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar SMS!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao enviar SMS: ", error.message)
      throw error
    }
  }

  public async ResendSMSVerification(phoneNumber: string) {
    try {
      const response = await fetch(`${baseUrl}/phone/resend-verification-code`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar SMS!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao reenviar código: ", error.message)
      throw error
    }
  }

  public ValidateSMSCode = async (phoneNumber: string, code: string) => {
    try {
      const response = await fetch(`${baseUrl}/phone/validate-code`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, code })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar SMS!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao validar código: ", error.message)
      throw error
    }
  }
}

export { PhoneService }