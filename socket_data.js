const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const WebSocket = require('ws');
const Wallet = require('./models/Wallet');


app.get('/', function(req, res) {
    res.sendfile('socket_test.html');
 });

 app.get('/wallet', function(req,res) {

 });
 
 io.on('connection', function(socket) {
    console.log('A user connected');
 
    socket.on('disconnect', function () {
       console.log('A user disconnected');
    });

    socket.on('wallets', function(user_id) {
        Wallet.find({user_id: user_id}, function(err, data) {
            console.log(data);
        });
    })
    
 });
 
 http.listen(7010, function() {
    console.log('listening on *:3000');
 });