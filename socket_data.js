const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const WebSocket = require('ws');
const MarginOrder = require('./models/MarginOrder');
const Wallet = require('./models/Wallet');


app.get('/', function (req, res) {
   res.sendfile('socket_test.html');
});

app.get('/wallet', function (req, res) {

});

io.on('connection', function (socket) {
   console.log('A user connected');

   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });

   socket.on('wallets', function (user_id) {
      Wallet.find({ user_id: user_id }, function (err, data) {
         console.log(data);
      });
   });

   socket.on('pnl', function (user_id) {
      let orders = await MarginOrder.find({ status: 0 }).exec();

      let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
         //orders = data;
         orders = await MarginOrder.find({ status: 0 }).exec();

      });
      let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
         orders = await MarginOrder.find({ status: 0 }).exec();
      });
      let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
         console.log("silindi");
         orders = await MarginOrder.find({ status: 0 }).exec();
      });

      let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
         console.log("silindi 2");
         orders = await MarginOrder.find({ status: 0 }).exec();

      });


      const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
      allTickers.onopen = () => {
         allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
               let symbol = list[i].s.replace("/", "");
               for (var k = 0; k < orders.length; k++) {
                  let order = orders[k];
                  if (order.pair_name == symbol) {
                     let total = 0;
                  }
               }
            }
         }
      }
   });

});

http.listen(7010, function () {
   console.log('listening on *:3000');
});