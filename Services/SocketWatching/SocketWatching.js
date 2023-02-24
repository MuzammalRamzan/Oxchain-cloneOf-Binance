const Connection = require("../../Connection");
const calculateFutureFund = require("../../Functions/Future/calculateFutureFunds");
const SpotWalletJoin = require("../../Functions/Spot/SpotWalletJoin");
const FutureWalletModel = require("../../models/FutureWalletModel");
const SocketRoomsModel = require("../../models/SocketRoomsModel");
const Wallet = require("../../models/Wallet");
const io = require("../../SocketController/socket_io_data");

async function SocketWatchController() {
    await Connection.connection();
    let sockets = io;

    var roomInUsers = await SocketRoomsModel.find();
    SocketRoomsModel.watch([
        {
            $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } }
        }
    ]).on('change', async data => {
        roomInUsers = await SocketRoomsModel.find();
    });



    //Spot Wallet
    Wallet.watch([
        { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
    ]).on("change", async (data) => {
        console.log(data);
        let wallet_id = data.documentKey._id;

        let select = await Wallet.findOne({ _id : wallet_id }).exec();
        let wallets = await Wallet.find({user_id : select.user_id});
        let assets = await SpotWalletJoin(wallets);
  
        roomInUsers.filter((r) => r.process == 'wallets' && r.user_id == select.user_id).forEach((room) => {
            sockets.emit('wallets', assets);
        })
        

    });

    //Future Wallet
    /*
    FutureWalletModel.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await FutureWalletModel.find({ user_id: user_id, status: 1 });
        let assets = await calculateFutureFund(wallets, user_id);
        roomInUsers.filter((p) => p.process == 'future_assets').forEach(room => {
            sockets.in(room.token).emit("future_assets", { page: "future", type: 'assets', content: assets });
        })

    });
    */
}

SocketWatchController();