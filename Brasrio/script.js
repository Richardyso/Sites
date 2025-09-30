// Atualizar ano
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
});

// Menu responsivo
const menuToggle = document.getElementById("menu-toggle");
const menu = document.querySelector("nav ul");

menuToggle.addEventListener("click", () => {
  menu.classList.toggle("active");
});

// Envio de formulário fake
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Mensagem enviada com sucesso! 🚀");
  e.target.reset();
});
