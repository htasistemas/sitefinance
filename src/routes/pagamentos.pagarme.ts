import { Router } from 'express';
import https from 'node:https';

type PlanoSlug = 'mensal' | 'semestral' | 'anual' | 'teste';

const router = Router();

const planosValores: Record<PlanoSlug, { descricao: string; valorCentavos: number }> = {
  mensal: { descricao: 'Assinatura mensal', valorCentavos: 3990 },
  semestral: { descricao: 'Assinatura semestral', valorCentavos: 2990 * 6 },
  anual: { descricao: 'Assinatura anual', valorCentavos: 1990 * 12 },
  teste: { descricao: 'Teste de 7 dias', valorCentavos: 0 },
};

function requestPagarme(path: string, payload: unknown): Promise<any> {
  const apiKey = process.env.PAGARME_SECRET_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('Chave secreta do Pagar.me não configurada'));
  }

  const body = JSON.stringify(payload);

  const options: https.RequestOptions = {
    hostname: 'api.pagar.me',
    port: 443,
    path,
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const statusCode = res.statusCode || 500;
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (statusCode >= 200 && statusCode < 300) {
            resolve(parsed);
          } else {
            const message = parsed?.errors?.[0]?.message || parsed?.message || 'Erro inesperado ao contatar o Pagar.me';
            reject(new Error(message));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(body);
    req.end();
  });
}

router.post('/cartao', async (req, res) => {
  try {
    const { cardName, cardNumber, cardExpiry, cardCvv, cpf, plano } = req.body as {
      cardName?: string;
      cardNumber?: string;
      cardExpiry?: string;
      cardCvv?: string;
      cpf?: string;
      plano?: PlanoSlug;
    };

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv || !cpf || !plano) {
      return res.status(400).json({ mensagem: 'Dados do cartão incompletos' });
    }

    const planoInfo = planosValores[plano];
    if (!planoInfo) {
      return res.status(400).json({ mensagem: 'Plano informado é inválido' });
    }

    const [mes, ano] = cardExpiry.split('/');
    const payload = {
      items: [
        {
          amount: planoInfo.valorCentavos,
          description: planoInfo.descricao,
          quantity: 1,
          code: plano,
        },
      ],
      customer: {
        name: cardName,
        document: cpf.replace(/\D+/g, ''),
        type: 'individual',
      },
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            installments: 1,
            statement_descriptor: 'FinancePro',
            card: {
              holder_name: cardName,
              number: cardNumber.replace(/\s+/g, ''),
              exp_month: Number(mes),
              exp_year: Number(`20${ano}`),
              cvv: cardCvv,
            },
          },
        },
      ],
    };

    const order = await requestPagarme('/core/v5/orders', payload);

    return res.status(201).json({
      orderId: order.id,
      status: order.status,
      charges: order.charges,
    });
  } catch (error: any) {
    return res.status(502).json({ mensagem: 'Falha ao registrar pagamento no Pagar.me', detalhe: error.message });
  }
});

router.get('/ordens/:id', async (req, res) => {
  try {
    const apiKey = process.env.PAGARME_SECRET_KEY;
    if (!apiKey) {
      return res.status(503).json({ mensagem: 'Chave secreta do Pagar.me não configurada' });
    }

    const orderId = req.params.id;
    const options: https.RequestOptions = {
      hostname: 'api.pagar.me',
      port: 443,
      path: `/core/v5/orders/${orderId}`,
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    };

    const statusResponse = await new Promise<any>((resolve, reject) => {
      const reqStatus = https.request(options, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if ((resp.statusCode || 500) >= 200 && (resp.statusCode || 500) < 300) {
              resolve(parsed);
            } else {
              const message = parsed?.errors?.[0]?.message || parsed?.message || 'Erro ao consultar ordem no Pagar.me';
              reject(new Error(message));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      reqStatus.on('error', (err) => reject(err));
      reqStatus.end();
    });

    return res.json({ id: statusResponse.id, status: statusResponse.status });
  } catch (error: any) {
    return res.status(502).json({ mensagem: 'Erro ao consultar status no Pagar.me', detalhe: error.message });
  }
});

export default router;
