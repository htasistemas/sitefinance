import express from 'express';
import dotenv from 'dotenv';
import pagamentosMercadoPagoRouter from './routes/pagamentos.mercadopago';
import pagamentosPagarmeRouter from './routes/pagamentos.pagarme';
import pagamentosInfinitePayRouter from './routes/pagamentos.infinitepay';
import adminMercadoPagoRouter from './routes/admin.mercadopago-config';
import contatoRouter from './routes/contato';

dotenv.config();

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  return next();
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/pagamentos/mercadopago', pagamentosMercadoPagoRouter);
app.use('/api/pagamentos/pagarme', pagamentosPagarmeRouter);
app.use('/api/pagamentos/infinitepay', pagamentosInfinitePayRouter);
app.use('/api/admin', adminMercadoPagoRouter);
app.use('/api/contato', contatoRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API Finance Pro Master rodando na porta ${port}`);
});
