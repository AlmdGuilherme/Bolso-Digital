import { CreateEnvelopeDTO } from "../Interface/CreateEnvelopeDTOS";
import { TransferEnvelopesDTO } from "../Interface/TransferEnvelopesDTO";

// const baseUrl = 'http://192.168.1.102:3000' // Net 2
// const baseUrl = 'http://192.168.15.59:3000' // Net 1
const baseUrl = 'http://192.168.43.131:3000' // Celular
// const baseUrl = 'http://192.168.0.100:3000' // Net 1.24

export class EnvelopeService {
  async createEnvelope(create_data: CreateEnvelopeDTO) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${create_data.accountNumber}/envelopes/create`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: create_data.name,
          allocated_amount: create_data.allocated_amount
        })
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar envelope!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao criar envelope: ", error.message)
      throw error
    }
  }

  async getEnvelopes(account_number: string) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${account_number}/envelopes`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar envelopes");
      }

      return data;
    } catch (error: any) {
      console.error("Erro ao buscar envelopes: ", error.message);
      throw error;
    }
  }

  async transferBetweenEnvelopes(transfer_data: TransferEnvelopesDTO) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${transfer_data.accountNumber}/envelopes/transfer`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_envelope_id: transfer_data.source_envelope_id,
          target_envelope_id: transfer_data.target_envelope_id,
          amount: transfer_data.amount
        })
      })

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao transferir valores entre envelopes!")
      }

      return data
    } catch (error: any) {
      console.error("Erro ao transferir valor entre envelopes: ", error.message)
      throw error
    }
  }

  async getEnvelopeHistory(envelopeId: number) {
    try {
      const response = await fetch(`${baseUrl}/accounts/${envelopeId}/history`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar histórico do envelope.");
      }
      return data;
    } catch (error: any) {
      console.error("Erro ao buscar histórico do envelope/orçamento: ", error.message)
    }
  }
}