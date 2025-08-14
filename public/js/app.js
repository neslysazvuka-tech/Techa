const socket = io();

// Подключение к чату
const username = prompt('Введите ваш никнейм:');
socket.emit('join', username);

// Отправка сообщения
document.getElementById('send').addEventListener('click', () => {
  const text = document.getElementById('message').value;
  socket.emit('message', text);
  document.getElementById('message').value = '';
});

// Получение сообщений
socket.on('message', (msg) => {
  const messages = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
  messages.appendChild(messageElement);
  
  // Автоудаление через 1 минуту
  setTimeout(() => {
    messageElement.remove();
  }, 60000);
});
