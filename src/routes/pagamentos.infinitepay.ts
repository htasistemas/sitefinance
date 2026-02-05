import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../config/database';
import {
  criarPagamentoInfinitePay,
  atualizarPagamentoInfinitePay,
  obterPagamentoPorOrderNsu,
} from '../services/pagamento-infinitepay.service';
import { calcularDatasPlano, criarAssinatura, atualizarStatusAssinatura } from '../services/assinatura.service';

const router = Router();

const INFINITEPAY_API_BASE = 'https://api.infinitepay.io';

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente ${key} não configurada`);
  }
  return value;
};

const fetchInfinitePay = async (path: string, payload: unknown) => {
  const response = await fetch(`${INFINITEPAY_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Erro ao comunicar com InfinitePay';
    throw new Error(message);
  }

  return data;
};

router.post('/checkout-link', async (req, res) => {
  try {
    const { planoId, periodicidade, quantidade } = req.body as {
      planoId?: string;
      periodicidade?: string;
      quantidade?: number;
      usuarioId?: number;
      email?: string;
    };

    if (!planoId) {
      return res.status(400).json({ mensagem: 'planoId é obrigatório' });
    }

    const planoResult = await query('SELECT * FROM planos WHERE id = $1 AND ativo = true', [planoId]);
    if (planoResult.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Plano não encontrado ou inativo' });
    }
    const plano = planoResult.rows[0];

    const periodicidadeInput = (periodicidade || plano.tipo || '').toUpperCase();
    if (plano.tipo && periodicidade && plano.tipo.toUpperCase() !== periodicidadeInput) {
      return res.status(400).json({ mensagem: 'Periodicidade inválida para o plano informado' });
    }
    const quantidadeFinal = quantidade && Number.isFinite(quantidade) ? Math.max(1, quantidade) : 1;

    const totalCentavos = plano.valor_centavos * quantidadeFinal;
    const orderNsu = randomUUID();

    const usuarioIdFinal = req.body.usuarioId ? Number(req.body.usuarioId) : null;
    let emailFinal: string | null = req.body.email ? String(req.body.email).trim() : null;
    if (usuarioIdFinal) {
      const usuarioResult = await query('SELECT id, email FROM usuarios WHERE id = $1', [usuarioIdFinal]);
      if (usuarioResult.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }
      emailFinal = usuarioResult.rows[0]?.email || emailFinal;
    }

    await criarPagamentoInfinitePay({
      orderNsu,
      planoId: Number(planoId),
      periodicidade: periodicidadeInput,
      quantidade: quantidadeFinal,
      valorCentavos: totalCentavos,
      status: 'PENDENTE',
      usuarioId: usuarioIdFinal,
      email: emailFinal,
    });

    const handle = getRequiredEnv('INFINITEPAY_HANDLE');
    const redirectUrl = getRequiredEnv('INFINITEPAY_REDIRECT_URL');
    const webhookUrl = getRequiredEnv('INFINITEPAY_WEBHOOK_URL');

    const payload = {
      handle,
      order_nsu: orderNsu,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      items: [
        {
          quantity: 1,
          price: totalCentavos,
          description: `Assinatura ${plano.nome} (${periodicidadeInput})`,
        },
      ],
    };

    const data = await fetchInfinitePay('/invoices/public/checkout/links', payload);
    const url = data?.url || data?.checkout_url || data?.link;

    if (!url) {
      return res.status(502).json({ mensagem: 'Checkout InfinitePay não retornou URL' });
    }

    res.status(201).json({ success: true, url });
  } catch (error: any) {
    console.error('Erro ao criar checkout InfinitePay', error);
    res.status(500).json({ mensagem: 'Não foi possível iniciar o pagamento', detalhe: error.message });
  }
});

router.post('/payment-check', async (req, res) => {
  try {
    const { order_nsu, transaction_nsu, slug, receipt_url } = req.body as {
      order_nsu?: string;
      transaction_nsu?: string;
      slug?: string;
      receipt_url?: string;
    };

    if (!order_nsu || !transaction_nsu || !slug) {
      return res.status(400).json({ mensagem: 'order_nsu, transaction_nsu e slug são obrigatórios' });
    }

    console.log('[InfinitePay] payment-check', { order_nsu, transaction_nsu });

    const pagamento = await obterPagamentoPorOrderNsu(order_nsu);
    if (!pagamento) {
      return res.status(404).json({ mensagem: 'Pagamento não encontrado' });
    }

    const handle = getRequiredEnv('INFINITEPAY_HANDLE');
    const data = await fetchInfinitePay('/invoices/public/checkout/payment_check', {
      handle,
      order_nsu,
      transaction_nsu,
      slug,
    });

    const paid = Boolean(data?.paid);
    if (paid && pagamento.status !== 'PAGO') {
      await atualizarPagamentoInfinitePay({
        orderNsu: order_nsu,
        status: 'PAGO',
        transactionNsu: transaction_nsu,
        slug,
        receiptUrl: receipt_url || null,
        payload: data,
      });

      if (pagamento.usuario_id) {
        const plano = await query('SELECT tipo FROM planos WHERE id = $1', [pagamento.plano_id]);
        const tipoPlano = plano.rows[0]?.tipo;
        const datas = tipoPlano ? calcularDatasPlano(tipoPlano) : { inicio: null, fim: null };
        const assinatura = await criarAssinatura({
          usuarioId: pagamento.usuario_id,
          planoId: pagamento.plano_id,
          meioPagamento: 'infinitepay',
          valorCentavos: pagamento.valor_centavos,
        });
        await atualizarStatusAssinatura(assinatura.id, 'aprovado', transaction_nsu, datas.inicio, datas.fim);
      }
    }

    res.json({ success: true, paid });
  } catch (error: any) {
    console.error('Erro ao validar pagamento InfinitePay', error);
    res.status(500).json({ mensagem: 'Não foi possível validar o pagamento', detalhe: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { order_nsu, transaction_nsu, invoice_slug, slug, receipt_url } = req.body as {
      order_nsu?: string;
      transaction_nsu?: string;
      invoice_slug?: string;
      slug?: string;
      receipt_url?: string;
    };

    if (!order_nsu || !transaction_nsu || !(invoice_slug || slug)) {
      return res.status(400).json({ mensagem: 'Webhook inválido' });
    }

    console.log('[InfinitePay] webhook', { order_nsu, transaction_nsu });

    const pagamento = await obterPagamentoPorOrderNsu(order_nsu);
    if (!pagamento) {
      return res.status(404).json({ mensagem: 'Pagamento não encontrado' });
    }

    if (pagamento.status === 'PAGO') {
      return res.status(200).json({ success: true, message: null });
    }

    const handle = getRequiredEnv('INFINITEPAY_HANDLE');
    const data = await fetchInfinitePay('/invoices/public/checkout/payment_check', {
      handle,
      order_nsu,
      transaction_nsu,
      slug: invoice_slug || slug,
    });

    const paid = Boolean(data?.paid);
    if (paid) {
      await atualizarPagamentoInfinitePay({
        orderNsu: order_nsu,
        status: 'PAGO',
        transactionNsu: transaction_nsu,
        slug: invoice_slug || slug,
        receiptUrl: receipt_url || null,
        payload: data,
      });

      if (pagamento.usuario_id) {
        const plano = await query('SELECT tipo FROM planos WHERE id = $1', [pagamento.plano_id]);
        const tipoPlano = plano.rows[0]?.tipo;
        const datas = tipoPlano ? calcularDatasPlano(tipoPlano) : { inicio: null, fim: null };
        const assinatura = await criarAssinatura({
          usuarioId: pagamento.usuario_id,
          planoId: pagamento.plano_id,
          meioPagamento: 'infinitepay',
          valorCentavos: pagamento.valor_centavos,
        });
        await atualizarStatusAssinatura(assinatura.id, 'aprovado', transaction_nsu, datas.inicio, datas.fim);
      }
    }

    res.status(200).json({ success: true, message: null });
  } catch (error: any) {
    console.error('Erro no webhook InfinitePay', error);
    res.status(500).json({ success: false, message: error.message || 'Erro ao processar webhook' });
  }
});

export default router;
