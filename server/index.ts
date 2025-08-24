import express from 'express';
import { Server as SocketIO } from 'socket.io';
import http from 'http';
import { router } from './routes/route.js';
import cors from 'cors';
import { addUser, removeUser, getUser, getUsersInRoom } from './controllers/user.js';

const PORT: number = 8000;

const app: express.Application = express();
const server: http.Server = http.createServer(app);

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
}))

const socketIO: SocketIO = new SocketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

socketIO.on('connection', (socket) => {

  socket.on('join', ({name, room}, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      return callback(error);
    }

    if (!user?.room){
      return callback('Room is required');
    }

    socket.emit('message', {user: 'admin', text: `${user.name}, Welcome to the Room ${user.room}`});

    socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined!`});

    socket.join(user.room);

    socketIO.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    if (!user?.room) {
      return callback('Room is required');
    }

    socketIO.to(user.room).emit('message', {user: user.name, text: message});
    socketIO.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
    callback();
  })
  
  console.log('A user connected');
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if(user){
      socketIO.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left.`});
    }
  });
})

app.use('/', router);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});