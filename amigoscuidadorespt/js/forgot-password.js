// Forgot Password Logic
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotPasswordForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const messageContainer = document.getElementById('message-container');

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
    
    // Auto-esconder mensagem após 5 segundos
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

  // Lidar com envio do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Por favor, insira um email válido');
      return;
    }
    
    toggleButton(true);
    messageContainer.innerHTML = '';
    
    try {
      const response = await fetch(`${API_URL}/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(
          'Código enviado! Verifique seu email e siga as instruções.', 
          'success'
        );
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
        }, 3000);
      } else {
        showMessage(data.message || 'Erro ao enviar código. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao processar solicitação. Tente novamente.');
    } finally {
      toggleButton(false);
    }
  });
  
  // Focar no campo de email
  document.getElementById('email').focus();
});
