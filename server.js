const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');

// Подключение к MongoDB
mongoose.connect('mongodb://localhost/chat', {useNewUrlParser: true});

// Модель сообщения
const Message = mongoose.model('Message', {
  user: String,
  text: String,
  createdAt: { type: Date, expires: 60, default: Date.now } // Удаление через 60 сек
});

const app = express();
const server = app.listen(3000);
const io = socketio(server);

io.on('connection', (socket) => {
  // Новый пользователь
  socket.on('join', (username) => {
    socket.username = username;
    io.emit('userJoined', username);
  });

  // Новое сообщение
  socket.on('message', async (text) => {
    const message = new Message({ user: socket.username, text });
    await message.save();
    io.emit('message', { user: socket.username, text, createdAt: new Date() });
  });
});
