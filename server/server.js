const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("使用者連線:", socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;
    waitingUser.emit("message", "已找到聊天對象");
    socket.emit("message", "已找到聊天對象");
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("message", "等待其他人加入...");
  }

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("leave", () => {
    console.log(`${socket.id} 離開聊天室`);
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) waitingUser = null;
    socket.disconnect(true);
  });

  socket.on("disconnect", () => {
    console.log("使用者離線:", socket.id);
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) waitingUser = null;
  });
});

server.listen(3000, () => {
  console.log("伺服器已啟動，埠號 3000");
});
