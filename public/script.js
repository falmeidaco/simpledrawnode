const socket = io();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cursorsLayer = document.getElementById('cursors-layer');

let drawing = false;
let currentRoom = null;
const myId = Math.random().toString(36).substring(7);
const otherCursors = {};

function joinRoom() {
    const code = document.getElementById('roomInput').value;
    if (code.length === 6) {
        currentRoom = code;
        document.getElementById('roomLabel').innerText = code;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('join-room', code);
    }
}

function renderPoint(data) {
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = data.color;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
}

canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => { drawing = false; ctx.beginPath(); };

canvas.onmousemove = (e) => {
    if (!currentRoom) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit('mouse-move', { x, y, room: currentRoom, userId: myId });

    if (drawing) {
        const data = { x, y, room: currentRoom, color: document.getElementById('colorPicker').value };
        renderPoint(data);
        socket.emit('draw', data);
    }
};

function clearCanvas() {
    if (currentRoom) socket.emit('clear-canvas', currentRoom);
}

// Eventos Socket
socket.on('draw', renderPoint);
socket.on('clear-canvas', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
});

socket.on('user-count', (count) => {
    document.getElementById('userCount').innerText = count;
});

socket.on('load-history', (history) => {
    history.forEach(renderPoint);
    ctx.beginPath();
});

socket.on('mouse-move', (data) => {
    if (!otherCursors[data.userId]) {
        const div = document.createElement('div');
        div.className = 'cursor';
        cursorsLayer.appendChild(div);
        otherCursors[data.userId] = div;
    }
    otherCursors[data.userId].style.transform = `translate(${data.x}px, ${data.y}px)`;
});