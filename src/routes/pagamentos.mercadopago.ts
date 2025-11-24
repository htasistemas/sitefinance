import { Router } from 'express';
import { query } from '../config/database';
import { getMercadoPagoClient } from '../config/mercado-pago';
import {
  atualizarStatusAssinatura,
  calcularDatasPlano,
  criarAssinatura,
  obterAssinaturaPorPayment,
  obterAssinaturaPorPreference,
} from '../services/assinatura.service';

const router = Router();

router.post('/checkout', async (req, res) => {
  try {
    const { usuarioId, planoId, meioPagamento } = req.body;

    if (!usuarioId || !planoId || !meioPagamento) {
      return res.status(400).json({ mensagem: 'usuarioId, planoId e meioPagamento são obrigatórios' });
    }

    const usuarioResult = await query('SELECT id, nome, email FROM usuarios WHERE id = $1', [usuarioId]);
    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    const usuario = usuarioResult.rows[0];

    const planoResult = await query('SELECT * FROM planos WHERE id = $1 AND ativo = true', [planoId]);
    if (planoResult.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Plano não encontrado ou inativo' });
    }
    const plano = planoResult.rows[0];

    const assinatura = await criarAssinatura({
      usuarioId,
      planoId,
      meioPagamento,
      valorCentavos: plano.valor_centavos,
    });

    const mp = await getMercadoPagoClient();
    const preference = await mp.preferences.create({
      items: [
        {
          title: plano.nome,
          description: plano.descricao,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: plano.valor_centavos / 100,
        },
      ],
      payer: {
        name: usuario.nome,
        email: usuario.email,
      },
      payment_methods: {
        excluded_payment_types: meioPagamento === 'pix' ? [{ id: 'ticket' }, { id: 'credit_card' }] : [],
      },
      back_urls: {
        success: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/pagamento/sucesso?assinaturaId=${assinatura.id}`,
        failure: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/pagamento/erro?assinaturaId=${assinatura.id}`,
        pending: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/pagamento/pendente?assinaturaId=${assinatura.id}`,
      },
      notification_url: `${process.env.BACKEND_BASE_URL || 'http://localhost:3001'}/api/pagamentos/mercadopago/webhook`,
      statement_descriptor: 'FinanceProMaster',
    });

    await query('UPDATE assinaturas SET mercadopago_preference_id = $1 WHERE id = $2', [
      preference.body.id,
      assinatura.id,
    ]);

    res.status(201).json({
      preferenceId: preference.body.id,
      initPoint: preference.body.init_point,
      sandboxInitPoint: preference.body.sandbox_init_point,
      assinaturaId: assinatura.id,
      plano,
    });
  } catch (error: any) {
    console.error('Erro ao criar checkout do Mercado Pago', error);
    res.status(500).json({ mensagem: 'Não foi possível iniciar o pagamento', detalhe: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;
    const type = notification.type || notification.type_id;
    const paymentId = notification.data?.id || notification['data.id'];

    if (type !== 'payment' || !paymentId) {
      return res.status(200).json({ mensagem: 'Notificação ignorada' });
    }

    const mp = await getMercadoPagoClient();
    const payment = await mp.payment.findById(paymentId);
    const info = payment.body;

    const preferenceId = info.order?.id || info.preference_id;

    let assinatura = await obterAssinaturaPorPayment(paymentId);
    if (!assinatura && preferenceId) {
      assinatura = await obterAssinaturaPorPreference(preferenceId);
    }

    if (!assinatura) {
      return res.status(404).json({ mensagem: 'Assinatura não localizada para a notificação recebida' });
    }

    let novoStatus = 'pendente';
    if (info.status === 'approved') {
      novoStatus = 'aprovado';
    } else if (info.status === 'rejected' || info.status === 'cancelled') {
      novoStatus = 'cancelado';
    }

    const plano = await query('SELECT tipo FROM planos WHERE id = $1', [assinatura.plano_id]);
    const tipoPlano = plano.rows[0]?.tipo;

    const datas = novoStatus === 'aprovado' && tipoPlano ? calcularDatasPlano(tipoPlano) : { inicio: null, fim: null };

    await atualizarStatusAssinatura(
      assinatura.id,
      novoStatus,
      info.id?.toString() || null,
      datas.inicio,
      datas.fim
    );

    res.status(200).json({ mensagem: 'Notificação processada' });
  } catch (error: any) {
    console.error('Erro ao processar webhook do Mercado Pago', error);
    res.status(500).json({ mensagem: 'Erro ao processar webhook', detalhe: error.message });
  }
});

router.get('/assinaturas/:id', async (req, res) => {
  try {
    const assinaturaId = parseInt(req.params.id, 10);
    const result = await query('SELECT * FROM assinaturas WHERE id = $1', [assinaturaId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Assinatura não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ mensagem: 'Erro ao carregar assinatura', detalhe: error.message });
  }
});

export default router;
