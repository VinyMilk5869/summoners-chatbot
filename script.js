// Toggle el chat (ocultar/mostrar)
const toggleBtn = document.getElementById('toggleChat');
const chatIframe = document.getElementById('chatBot');

toggleBtn.addEventListener('click', () => {
    if (chatIframe.style.display === "none") {
        chatIframe.style.display = "block";
    } else {
        chatIframe.style.display = "none";
    }
});
