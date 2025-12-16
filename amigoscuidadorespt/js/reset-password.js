// Reset Password Logic
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetPasswordForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const messageContainer = document.getElementById('message-container');
  
  // Pegar email da URL se disponível
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  if (emailFromUrl) {
    document.getElementById('email').value = emailFromUrl;
  }

  // Função para mostrar mensagem
  function showMessage(message, type = 'error') {
    const alertClass = type === 'success' ? 'success-message' : 'error-message';
    const icon = type === 'success' 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    
    messageContainer.innerHTML = `
      <div class="message ${alertClass}">
        ${icon}
        <span>${message}</span>
      </div>
    `;
    
    // Auto-esconder mensagem de erro após 5 segundos
    if (type === 'error') {
      setTimeout(() => {
        messageContainer.innerHTML = '';
      }, 5000);
    }
  }

  // Função para alternar estado do botão
  function toggleButton(loading) {
    submitBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoader.style.display = loading ? 'inline' : 'none';
  }

  // Validar força da senha
  function validatePassword(password) {
    if (password.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }
    
    // Verificar se tem pelo menos um número
    if (!/\d/.test(password)) {
      return 'A senha deve conter pelo menos um número';
    }
    
    return null;
  }

  // Formatar código - aceitar apenas números
  document.getElementById('code').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });

  // Lidar com envio do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const code = document.getElementById('code').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Por favor, insira um email válido');
      return;
    }
    
    if (code.length !== 6) {
      showMessage('O código deve ter 6 dígitos');
      return;
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showMessage(passwordError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem');
      return;
    }
    
    toggleButton(true);
    messageContainer.innerHTML = '';
    
    try {
      const response = await fetch(`${API_URL}/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(
          'Senha redefinida com sucesso! Redirecionando para o login...', 
          'success'
        );
        
        // Limpar formulário
        form.reset();
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 3000);
      } else {
        showMessage(data.message || 'Erro ao redefinir senha. Verifique o código.');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao processar solicitação. Tente novamente.');
    } finally {
      toggleButton(false);
    }
  });
  
  // Focar no campo apropriado
  if (emailFromUrl) {
    document.getElementById('code').focus();
  } else {
    document.getElementById('email').focus();
  }
});
