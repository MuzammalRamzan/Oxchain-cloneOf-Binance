const http = require("http");
const https = require("https");
const socketio = require("socket.io");
var fs = require('fs');

require("dotenv").config();

var server = null;
if (process.env.NODE_ENV == 'product') {
    https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/socket.oxhain.com-0001/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/socket.oxhain.com-0001/cert.pem')
    });
} else {
    server = http.createServer();
}
const io = new socketio.Server(server, {
    cors: {
        origin: "*",
    }
});

io.on("connection", (socket) => {
    socket.on('mesaj', (data) => {
        checkRoomOrJoin(socket, data);
    })
    
});

function checkRoomOrJoin(socket, id) {
    if(socket.rooms[id] == null) {
        socket.join(id);
    } else {
        console.log(id, " var");
        
    }
    console.log(socket.rooms);
}


server.listen(7011);