import { query } from '../config/database';

export interface PagamentoInfinitePayInput {
  orderNsu: string;
  planoId: number;
  periodicidade: string;
  quantidade: number;
  valorCentavos: number;
  status: string;
  usuarioId: number | null;
  email: string | null;
}

export async function criarPagamentoInfinitePay(input: PagamentoInfinitePayInput) {
  const result = await query(
    `INSERT INTO pagamentos_infinitepay
      (order_nsu, plano_id, periodicidade, quantidade, valor_centavos, status, usuario_id, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.orderNsu,
      input.planoId,
      input.periodicidade,
      input.quantidade,
      input.valorCentavos,
      input.status,
      input.usuarioId,
      input.email,
    ]
  );
  return result.rows[0];
}

export async function obterPagamentoPorOrderNsu(orderNsu: string) {
  const result = await query('SELECT * FROM pagamentos_infinitepay WHERE order_nsu = $1 LIMIT 1', [orderNsu]);
  return result.rows[0];
}

export async function atualizarPagamentoInfinitePay(params: {
  orderNsu: string;
  status: string;
  transactionNsu: string | null;
  slug: string | null;
  receiptUrl: string | null;
  payload: any;
}) {
  await query(
    `UPDATE pagamentos_infinitepay
     SET status = $1,
         transaction_nsu = COALESCE($2, transaction_nsu),
         slug = COALESCE($3, slug),
         receipt_url = COALESCE($4, receipt_url),
         payload = COALESCE($5, payload),
         atualizado_em = NOW()
     WHERE order_nsu = $6`,
    [params.status, params.transactionNsu, params.slug, params.receiptUrl, params.payload, params.orderNsu]
  );
}
