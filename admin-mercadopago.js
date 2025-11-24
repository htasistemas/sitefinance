const backendAdminBase = window.BACKEND_BASE_URL || 'http://localhost:3001';

async function carregarConfiguracao() {
  const status = document.getElementById('config-status');
  try {
    const resposta = await fetch(`${backendAdminBase}/api/admin/mercadopago-config`);
    if (!resposta.ok) throw new Error('Não foi possível carregar as configurações.');
    const config = await resposta.json();
    (document.getElementById('config-public-key') || {}).value = config.publicKey || '';
    const tokenInput = document.getElementById('config-access-token');
    if (tokenInput) tokenInput.placeholder = config.accessTokenMascarado || '';
    const sandboxSelect = document.getElementById('config-sandbox');
    if (sandboxSelect) sandboxSelect.value = `${config.modoSandbox}`;
    if (status) status.textContent = 'Configuração carregada.';
  } catch (error) {
    if (status) status.textContent = 'Erro ao carregar configuração.';
  }
}

async function salvarConfiguracao(event) {
  event.preventDefault();
  const status = document.getElementById('config-status');
  const publicKey = (document.getElementById('config-public-key') || {}).value;
  const accessToken = (document.getElementById('config-access-token') || {}).value;
  const modoSandbox = (document.getElementById('config-sandbox') || {}).value !== 'false';

  try {
    const resposta = await fetch(`${backendAdminBase}/api/admin/mercadopago-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey, accessToken, modoSandbox }),
    });
    if (!resposta.ok) throw new Error('Erro ao salvar configuração');
    if (status) status.textContent = 'Configuração salva com sucesso!';
  } catch (error) {
    if (status) status.textContent = 'Não foi possível salvar a configuração.';
  }
}

function inicializarAdminForm() {
  const form = document.getElementById('mercadopago-config-form');
  if (form) {
    form.addEventListener('submit', salvarConfiguracao);
  }
  carregarConfiguracao();
}

document.addEventListener('DOMContentLoaded', inicializarAdminForm);
