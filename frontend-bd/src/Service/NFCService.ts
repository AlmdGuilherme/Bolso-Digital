import nfcManager, { NfcManager, Ndef, NfcTech } from "react-native-nfc-manager";

nfcManager.start();

const QUICK_EXPENSES = {
  cafe: {
    description: "Café",
    amount: 8
  },
  almoco: {
    description: "Almoço",
    amount: 25
  },
  uber: {
    description: "Uber",
    amount: 15
  }
}

export type QuickExpenseKey = keyof typeof QUICK_EXPENSES

export class NFCService {
  async checkAvailability() {
    const supported = await nfcManager.isSupported();

    if (!supported) {
      throw new Error("Seu dispositivo não possuir suporte a NFC.")
    }

    const enabled = await nfcManager.isEnabled();

    if (!enabled) {
      throw new Error("O NFC está desativado. Ative nas confiugrações do celular.")
    }
  }

  async readTag() {
    try {
      await this.checkAvailability();
      await nfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await nfcManager.getTag();

      const payload: any = tag?.ndefMessage?.[0]?.payload;

      if (!payload) {
        throw new Error("Tag NFC sem dados.");
      }

      const tagValue = Ndef.text.decodePayload(payload);

      let parsedData;

      try {
        parsedData = JSON.parse(tagValue);
      } catch {
        throw new Error("Formato da tag NFC inválido. Grave a tag como JSON.");
      }

      if (!parsedData.description || parsedData.amount === undefined) {
        throw new Error("Tag NFC não possui descrição ou valor.");
      }

      const amount = Number(parsedData.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error("Valor da tag NFC inválido.");
      }

      return {
        description: String(parsedData.description),
        amount,
      };
    } catch (error: any) {
      throw new Error(error.message || "Erro ao ler tag NFC.");
    } finally {
      nfcManager.cancelTechnologyRequest();
    }
  }
}