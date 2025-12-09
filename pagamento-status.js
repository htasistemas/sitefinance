const backendStatusBase = window.BACKEND_BASE_URL || 'http://localhost:3001';
const localStorageKey = 'financepro.assinatura';

function obterIdDaAssinatura() {
  const params = new URLSearchParams(window.location.search);
  return params.get('assinaturaId');
}

function obterPlanoSelecionado() {
  const params = new URLSearchParams(window.location.search);
  return params.get('plano');
}

function carregarStatusLocal(mensagemEl, detalhesEl) {
  const plano = obterPlanoSelecionado();
  const registroBruto = localStorage.getItem(localStorageKey);
  if (!registroBruto) {
    if (mensagemEl) mensagemEl.textContent = 'Assinatura não validada nesta sessão.';
    if (detalhesEl) detalhesEl.textContent = 'Refaça o pagamento com os dados corretos.';
    return;
  }

  try {
    const registro = JSON.parse(registroBruto);
    if (registro.status === 'validado' && (!plano || registro.plano === plano)) {
      if (mensagemEl) mensagemEl.textContent = 'Pagamento validado localmente.';
      if (detalhesEl) {
        detalhesEl.innerHTML = `Plano: <strong>${registro.plano}</strong>. Acesse o sistema com as credenciais enviadas.`;
      }
    } else {
      if (mensagemEl) mensagemEl.textContent = 'Não foi possível confirmar o pagamento.';
      if (detalhesEl) detalhesEl.textContent = 'O plano selecionado não corresponde ao último pagamento validado.';
    }
  } catch (error) {
    if (mensagemEl) mensagemEl.textContent = 'Erro ao interpretar o status local da assinatura.';
    if (detalhesEl) detalhesEl.textContent = 'Tente reenviar o pagamento.';
  }
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
    carregarStatusLocal(mensagemEl, detalhesEl);
  }

  if (!assinaturaId) {
    carregarStatusLocal(mensagemEl, detalhesEl);
  }
}

document.addEventListener('DOMContentLoaded', carregarStatus);
