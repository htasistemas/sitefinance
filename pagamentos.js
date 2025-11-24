function redirecionarParaPagarme(botao) {
  const planoId = botao.dataset.planoId;
  const planoNome = botao.dataset.planoNome;

  const destino = new URL('pagamento.html', window.location.href);
  if (planoId) destino.searchParams.set('planoId', planoId);
  if (planoNome) destino.searchParams.set('planoNome', planoNome);
  destino.searchParams.set('gateway', 'pagarme');

  window.location.href = destino.toString();
}

function inicializarCheckout() {
  const botoesPlano = document.querySelectorAll('.js-pagarme');
  botoesPlano.forEach((botao) => {
    botao.addEventListener('click', () => redirecionarParaPagarme(botao));
  });
}

document.addEventListener('DOMContentLoaded', inicializarCheckout);
