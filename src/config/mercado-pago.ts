import mercadopago from 'mercadopago';
import { getMercadoPagoConfig } from '../services/configuracao-mercadopago.service';

export async function getMercadoPagoClient() {
  const config = await getMercadoPagoConfig();
  const mp = mercadopago as any;
  mp.configure({
    access_token: config.accessToken,
    sandbox: config.modoSandbox,
  });
  return mp;
}
