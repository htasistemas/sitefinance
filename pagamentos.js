function redirecionarParaPagarme(botao) {
  const planoId = botao.dataset.planoId;
  const planoSlug = botao.dataset.plano;
  const planoNome = botao.dataset.planoNome;

  const planoPorId = {
    1: 'mensal',
    2: 'semestral',
    3: 'anual'
  };

  const destino = new URL('pagamento.html', window.location.href);
  const planoFinal = planoSlug || planoPorId[planoId];

  if (planoFinal) destino.searchParams.set('plano', planoFinal);
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
