const backendBaseUrl = window.BACKEND_BASE_URL || 'http://localhost:3001';

function selecionarPlano(botao) {
  const planoIdInput = document.getElementById('checkout-plano-id');
  const planoTexto = document.getElementById('checkout-plano');
  if (!planoIdInput || !planoTexto) return;
  planoIdInput.value = botao.dataset.planoId;
  planoTexto.value = botao.dataset.planoNome;
}

async function iniciarCheckout(event) {
  event.preventDefault();
  const statusEl = document.getElementById('checkout-status');
  if (!statusEl) return;

  const usuarioIdInput = document.getElementById('checkout-usuario-id');
  const planoIdInput = document.getElementById('checkout-plano-id');
  const meioPagamentoSelect = document.getElementById('checkout-meio');

  const usuarioId = usuarioIdInput ? usuarioIdInput.value : '';
  const planoId = planoIdInput ? planoIdInput.value : '';
  const meioPagamento = meioPagamentoSelect ? meioPagamentoSelect.value : '';

  if (!usuarioId || !planoId || !meioPagamento) {
    statusEl.textContent = 'Preencha todos os campos para continuar.';
    statusEl.classList.add('payment-form__status--error');
    return;
  }

  statusEl.textContent = 'Gerando checkout seguro...';
  statusEl.classList.remove('payment-form__status--error');

  try {
    const resposta = await fetch(`${backendBaseUrl}/api/pagamentos/mercadopago/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: Number(usuarioId),
        planoId: Number(planoId),
        meioPagamento,
      }),
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({}));
      throw new Error(erro.mensagem || 'Erro ao iniciar o pagamento');
    }

    const payload = await resposta.json();
    statusEl.textContent = 'Redirecionando para o checkout seguro...';
    if (payload.initPoint) {
      window.location.href = payload.initPoint;
    }
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'Não foi possível iniciar o pagamento. Confira os dados ou tente novamente.';
    statusEl.classList.add('payment-form__status--error');
  }
}

function inicializarCheckout() {
  const botoesPlano = document.querySelectorAll('.js-mercadopago');
  botoesPlano.forEach((botao) => {
    botao.addEventListener('click', () => selecionarPlano(botao));
  });

  const form = document.getElementById('mercadopago-checkout-form');
  if (form) {
    form.addEventListener('submit', iniciarCheckout);
  }
}

document.addEventListener('DOMContentLoaded', inicializarCheckout);
