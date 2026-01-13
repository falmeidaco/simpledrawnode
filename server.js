const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Memória temporária para os desenhos de cada sala
const roomsHistory = {};

io.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('join-room', (roomCode) => {
        if (currentRoom) socket.leave(currentRoom);
        
        socket.join(roomCode);
        currentRoom = roomCode;

        // Envia histórico da sala para o novo usuário
        if (roomsHistory[roomCode]) {
            socket.emit('load-history', roomsHistory[roomCode]);
        }

        // Atualiza contagem de usuários na sala
        const count = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        io.in(roomCode).emit('user-count', count);
    });

    socket.on('draw', (data) => {
        // Salva no histórico
        if (!roomsHistory[data.room]) roomsHistory[data.room] = [];
        roomsHistory[data.room].push(data);
        
        // Replica para os outros
        socket.to(data.room).emit('draw', data);
    });

    socket.on('mouse-move', (data) => {
        socket.to(data.room).emit('mouse-move', data);
    });

    socket.on('clear-canvas', (roomCode) => {
        roomsHistory[roomCode] = [];
        io.in(roomCode).emit('clear-canvas');
    });

    socket.on('disconnect', () => {
        if (currentRoom) {
            const count = io.sockets.adapter.rooms.get(currentRoom)?.size || 0;
            io.in(currentRoom).emit('user-count', count);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));