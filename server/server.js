const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log(`🔌 使用者已連線: ${socket.id}`);

  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    socket.partner = partner;
    partner.partner = socket;

    socket.emit('match', { message: '已配對成功！' });
    partner.emit('match', { message: '已配對成功！' });
  } else {
    waitingUser = socket;
    socket.emit('waiting', { message: '等待配對中...' });
  }

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('partner-disconnected');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
    console.log(`❌ 使用者離線: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server is running on port 3000');
});
