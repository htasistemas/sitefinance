import { query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export interface MercadoPagoConfig {
  publicKey: string;
  accessToken: string;
  modoSandbox: boolean;
}

export async function getMercadoPagoConfig(): Promise<MercadoPagoConfig> {
  const result = await query(
    'SELECT public_key, access_token, modo_sandbox FROM configuracoes_mercadopago ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      publicKey: row.public_key,
      accessToken: row.access_token,
      modoSandbox: row.modo_sandbox,
    };
  }

  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN || !process.env.MERCADO_PAGO_PUBLIC_KEY) {
    throw new Error('Credenciais do Mercado Pago não configuradas. Configure no banco ou via variáveis de ambiente.');
  }

  return {
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY,
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    modoSandbox: process.env.MERCADO_PAGO_MODO_SANDBOX === 'false' ? false : true,
  };
}
