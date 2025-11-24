const backendStatusBase = window.BACKEND_BASE_URL || 'http://localhost:3001';

function obterIdDaAssinatura() {
  const params = new URLSearchParams(window.location.search);
  return params.get('assinaturaId');
}

async function carregarStatus() {
  const mensagemEl = document.getElementById('status-mensagem');
  const detalhesEl = document.getElementById('status-detalhes');
  const assinaturaId = obterIdDaAssinatura();

  if (!assinaturaId) {
    if (mensagemEl) mensagemEl.textContent = 'Assinatura não informada.';
    return;
  }

  try {
    const resposta = await fetch(`${backendStatusBase}/api/pagamentos/mercadopago/assinaturas/${assinaturaId}`);
    if (!resposta.ok) {
      throw new Error('Assinatura não encontrada.');
    }
    const assinatura = await resposta.json();
    if (mensagemEl) mensagemEl.textContent = `Status atual: ${assinatura.status}`;
    if (detalhesEl) {
      detalhesEl.textContent = assinatura.data_fim
        ? `Válido até: ${new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}`
        : 'Em processamento.';
    }
  } catch (error) {
    if (mensagemEl) mensagemEl.textContent = 'Não foi possível validar a assinatura.';
    if (detalhesEl) detalhesEl.textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', carregarStatus);
