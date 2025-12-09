import express from 'express';
import dotenv from 'dotenv';
import pagamentosMercadoPagoRouter from './routes/pagamentos.mercadopago';
import pagamentosPagarmeRouter from './routes/pagamentos.pagarme';
import adminMercadoPagoRouter from './routes/admin.mercadopago-config';
import contatoRouter from './routes/contato';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/pagamentos/mercadopago', pagamentosMercadoPagoRouter);
app.use('/api/pagamentos/pagarme', pagamentosPagarmeRouter);
app.use('/api/admin', adminMercadoPagoRouter);
app.use('/api/contato', contatoRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API Finance Pro Master rodando na porta ${port}`);
});
