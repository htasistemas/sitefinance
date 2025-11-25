import express from 'express';
import { sendContactEmail } from '../services/email.service';

const router = express.Router();

router.post('/', async (req, res) => {
  const { nome, email, mensagem } = req.body || {};

  if (!nome || !email || !mensagem) {
    return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
  }

  try {
    await sendContactEmail({ nome, email, mensagem });
    return res.status(200).json({ message: 'Mensagem enviada com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato', error);
    return res.status(500).json({ error: 'Não foi possível enviar a mensagem. Tente novamente mais tarde.' });
  }
});

export default router;
