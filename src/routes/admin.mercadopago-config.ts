import { Router } from 'express';
import { query } from '../config/database';
import { getMercadoPagoConfig } from '../services/configuracao-mercadopago.service';

const router = Router();

router.get('/mercadopago-config', async (_req, res) => {
  try {
    const config = await getMercadoPagoConfig();
    const maskedToken = config.accessToken.length > 10
      ? `${config.accessToken.substring(0, 4)}***${config.accessToken.substring(config.accessToken.length - 4)}`
      : '***';

    res.json({
      publicKey: config.publicKey,
      accessTokenMascarado: maskedToken,
      modoSandbox: config.modoSandbox,
    });
  } catch (error: any) {
    res.status(500).json({ mensagem: 'Erro ao carregar configuração do Mercado Pago', detalhe: error.message });
  }
});

router.post('/mercadopago-config', async (req, res) => {
  try {
    const { publicKey, accessToken, modoSandbox } = req.body;
    if (!publicKey || !accessToken) {
      return res.status(400).json({ mensagem: 'publicKey e accessToken são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO configuracoes_mercadopago (public_key, access_token, modo_sandbox, atualizado_em)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [publicKey, accessToken, modoSandbox !== false]
    );

    res.status(201).json({ id: result.rows[0].id, mensagem: 'Configuração atualizada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ mensagem: 'Erro ao salvar configuração do Mercado Pago', detalhe: error.message });
  }
});

export default router;
