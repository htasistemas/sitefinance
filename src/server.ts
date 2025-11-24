import express from 'express';
import dotenv from 'dotenv';
import pagamentosMercadoPagoRouter from './routes/pagamentos.mercadopago';
import adminMercadoPagoRouter from './routes/admin.mercadopago-config';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/pagamentos/mercadopago', pagamentosMercadoPagoRouter);
app.use('/api/admin', adminMercadoPagoRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API Finance Pro Master rodando na porta ${port}`);
});
