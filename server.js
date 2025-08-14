// Импорт необходимых модулей
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

// Инициализация приложения
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Конфигурация
const PORT = process.env.PORT || 3000;
const MESSAGE_LIFETIME = 60000; // 1 минута в миллисекундах

// Хранение сообщений в памяти (в реальном проекте лучше использовать БД)
const activeMessages = new Map(); // Используем Map для быстрого удаления

// Middleware для статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Обработчик корневого пути
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработчик соединений Socket.io
io.on('connection', (socket) => {
  console.log('Новое соединение:', socket.id);

  // Обработчик входа пользователя
  socket.on('join', (username) => {
    if (!username || username.trim() === '') {
      username = `User-${Math.floor(Math.random() * 1000)}`;
    }
    
    socket.username = username;
    console.log(`${username} присоединился к чату`);
    
    // Отправляем историю сообщений новому пользователю
    socket.emit('message_history', Array.from(activeMessages.values()));
    
    // Уведомляем всех о новом пользователе
    io.emit('system_message', {
      text: `${username} присоединился к чату`,
      timestamp: Date.now()
    });
  });

  // Обработчик новых сообщений
  socket.on('new_message', (messageText) => {
    if (!socket.username || !messageText || messageText.trim() === '') return;

    const message = {
      id: Date.now().toString(),
      user: socket.username,
      text: messageText,
      timestamp: Date.now()
    };

    // Сохраняем сообщение
    activeMessages.set(message.id, message);
    
    // Рассылаем сообщение всем клиентам
    io.emit('new_message', message);
    
    // Устанавливаем таймер для удаления сообщения
    setTimeout(() => {
      if (activeMessages.has(message.id)) {
        activeMessages.delete(message.id);
        io.emit('remove_message', message.id);
      }
    }, MESSAGE_LIFETIME);
  });

  // Обработчик отключения пользователя
  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('system_message', {
        text: `${socket.username} покинул чат`,
        timestamp: Date.now()
      });
      console.log(`${socket.username} отключился`);
    }
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Обработка ошибок
process.on('uncaughtException', (err) => {
  console.error('Необработанное исключение:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный промис:', promise, 'причина:', reason);
});
