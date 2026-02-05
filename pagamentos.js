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

async function redirecionarParaInfinitePay(botao) {
  const periodicidade = (botao.dataset.periodicidade || botao.dataset.plano || '').toUpperCase();
  const planoSlug = (botao.dataset.plano || '').toLowerCase();

  const destino = new URL('https://app.financepromaster.com.br/auth');
  if (planoSlug) destino.searchParams.set('plano', planoSlug);
  if (periodicidade) destino.searchParams.set('periodicidade', periodicidade);
  window.location.href = destino.toString();
}

function inicializarCheckout() {
  const botoesPlano = document.querySelectorAll('.js-pagarme');
  botoesPlano.forEach((botao) => {
    botao.addEventListener('click', () => redirecionarParaPagarme(botao));
  });

  const botoesInfinitePay = document.querySelectorAll('.js-infinitepay');
  botoesInfinitePay.forEach((botao) => {
    botao.addEventListener('click', () => redirecionarParaInfinitePay(botao));
  });
}

document.addEventListener('DOMContentLoaded', inicializarCheckout);
