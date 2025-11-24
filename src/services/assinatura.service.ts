import { query } from '../config/database';
import { calcularDataFim } from '../utils/assinatura';

export interface AssinaturaEntrada {
  usuarioId: number;
  planoId: number;
  meioPagamento: string;
  valorCentavos: number;
  preferenceId?: string;
  paymentId?: string;
}

export async function criarAssinatura(entrada: AssinaturaEntrada) {
  const result = await query(
    `INSERT INTO assinaturas (usuario_id, plano_id, status, meio_pagamento, valor_centavos, mercadopago_preference_id, mercadopago_payment_id)
     VALUES ($1, $2, 'pendente', $3, $4, $5, $6)
     RETURNING *`,
    [
      entrada.usuarioId,
      entrada.planoId,
      entrada.meioPagamento,
      entrada.valorCentavos,
      entrada.preferenceId || null,
      entrada.paymentId || null,
    ]
  );
  return result.rows[0];
}

export async function atualizarStatusAssinatura(
  id: number,
  status: string,
  paymentId: string | null,
  dataInicio: Date | null,
  dataFim: Date | null
) {
  await query(
    `UPDATE assinaturas SET status = $1, mercadopago_payment_id = COALESCE($2, mercadopago_payment_id), data_inicio = $3, data_fim = $4, atualizado_em = NOW() WHERE id = $5`,
    [status, paymentId, dataInicio, dataFim, id]
  );
}

export async function obterAssinaturaPorPreference(preferenceId: string) {
  const result = await query(
    'SELECT * FROM assinaturas WHERE mercadopago_preference_id = $1 ORDER BY id DESC LIMIT 1',
    [preferenceId]
  );
  return result.rows[0];
}

export async function obterAssinaturaPorPayment(paymentId: string) {
  const result = await query(
    'SELECT * FROM assinaturas WHERE mercadopago_payment_id = $1 ORDER BY id DESC LIMIT 1',
    [paymentId]
  );
  return result.rows[0];
}

export async function usuarioTemAssinaturaAtiva(usuarioId: number): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM assinaturas WHERE usuario_id = $1 AND status = 'aprovado' AND (data_fim IS NULL OR data_fim >= NOW()) LIMIT 1`,
    [usuarioId]
  );
  return result.rows.length > 0;
}

export function calcularDatasPlano(tipoPlano: string) {
  const inicio = new Date();
  const fim = calcularDataFim(tipoPlano, inicio);
  return { inicio, fim };
}
