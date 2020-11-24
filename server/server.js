const express = require("express");
const app = express();
const cors = require('cors');
const sockets = require("socket.io");
require('./config/mongoose.config');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('./routes/socket-chess.routes')(app);

const server = app.listen(9000, () => {
    console.log(`You are running on port 9000!`);
});

const io = sockets(server, { cors: true });
io.on("connection", socket => {
    socket.on("move", data => {
        console.log(data);
        socket.broadcast.emit("opponentMove", data);
    });
    socket.on("attack", data => {
        console.log(data);
        socket.broadcast.emit("opponentAttack", data);
    });
    socket.on("reset", data => {
        socket.broadcast.emit("userReset", data);
    });
    socket.on("refreshPage", data => {
        socket.broadcast.emit("refresh", data);
    });
    socket.on("check", data => {
        socket.broadcast.emit("opponentCheck", data);
    });
    socket.on("won", data => {
        socket.broadcast.emit("opponentWon", data);
    });
});