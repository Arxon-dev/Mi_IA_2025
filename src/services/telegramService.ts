import fetch from 'node-fetch'; // O la librería HTTP que prefieras para el backend

interface TelegramResponse {
  ok: boolean;
  description?: string;
  result?: any;
}

export class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error('Se requiere un token de bot de Telegram.');
    }
    this.botToken = botToken;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatid: string | number, text: string): Promise<any> {
    // 🔧 FIX: Validar que chat_id no esté vacío antes de enviar
    if (!chatid || chatid === '' || chatid === 0) {
      console.error('❌ Error: chat_id está vacío o es inválido:', chatid);
      throw new Error('chat_id no puede estar vacío');
    }
    
    const url = `${this.apiUrl}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatid,
          text: text,
          parse_mode: 'Markdown', // O 'HTML', según prefieras formatear
        }),
      });

      const responseData = await response.json() as TelegramResponse;

      if (!response.ok || !responseData.ok) {
        console.error('Error en la respuesta de Telegram:', responseData);
        throw new Error(
          responseData.description || 
          `Error al enviar mensaje a Telegram (status ${response.status})`
        );
      }
      console.log('Mensaje de Telegram enviado con éxito:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error al conectar con la API de Telegram:', error);
      throw error; // Relanzar para que el llamador lo maneje
    }
  }

  // Podrías añadir más métodos aquí (ej. sendPhoto, etc.)
}