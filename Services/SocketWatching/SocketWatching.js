const Connection = require("../../Connection");
const DerivativesCalculate = require("../../Functions/derivativesCalculate");
const FutureAssetsOverviewCalculate = require("../../Functions/Future/assetsOverviewCalculate");
const calculateFutureBalance = require("../../Functions/Future/calculateFutureBalance");
const calculateFutureFund = require("../../Functions/Future/calculateFutureFunds");
const GetFutureLiqPrice = require("../../Functions/Future/getFutureLiqPrice");
const SpotAssetsCalculate = require("../../Functions/Spot/SpotAssetsCalculate");

const SpotAssetsOverviewCalculate = require("../../Functions/Spot/SpotAssetsOverviewCalculate");
const SpotFundsCalculate = require("../../Functions/Spot/SpotFundsCalculate");
const SpotWalletJoin = require("../../Functions/Spot/SpotWalletJoin");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
const Orders = require("../../models/Orders");
const SocketRoomsModel = require("../../models/SocketRoomsModel");
const Transactions = require("../../models/Transactions");
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

    //Spot Order

    Orders.watch([{ $match: { operationType: { $in: ['insert', 'update'] } } }]).on('change', async data => {
        let item_id = data.documentKey._id;
        let select = await Orders.findOne({ _id: item_id }).exec();

        roomInUsers.filter((r) => r.process == 'spot_open_orders' && r.user_id == select.user_id).forEach(async (room) => {
            let orders = await Orders.find({ user_id: select.user_id, $or: [{ type: 'limit' }, { type: 'stop_limit' },], status: 1 });
            sockets.in(room.token).emit("spot_open_orders", { type: 'open_orders', content: orders });
        });

        roomInUsers.filter((r) => r.process == 'spot_order_history' && r.user_id == select.user_id).forEach(async (room) => {
            let orders = await Orders.find({
                user_id: room.user_id, $or: [
                    {
                        user_id: room.user_id,
                        type: 'limit'
                    },
                    {
                        user_id: room.user_id,
                        type: 'stop_limit'
                    },


                ]
            });
            sockets.in(room.token).emit("spot_order_history", { page: "spot", type: 'order_history', content: orders });
        });

        roomInUsers.filter((r) => r.process == 'spot_trade_history' && r.user_id == select.user_id).forEach(async (room) => {
            let orders = await Orders.find({
                user_id: room.user_id, type: 'market', $and:
                    [
                        { status: 0 },
                    ]
            });
            sockets.in(room.token).emit("spot_trade_history", { page: "spot", type: 'trade_history', content: orders });
        });


    });


    //Spot Wallet
    Wallet.watch([
        { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
    ]).on("change", async (data) => {
        let wallet_id = data.documentKey._id;

        let select = await Wallet.findOne({ _id: wallet_id }).exec();
        let wallets = await Wallet.find({ user_id: select.user_id });


        roomInUsers.filter((r) => r.process == 'wallets' && r.user_id == select.user_id).forEach(async (room) => {
            let assets = await SpotWalletJoin(wallets);
            sockets.in(room.token).emit('wallets', assets);
        });

        roomInUsers.filter((r) => r.process == 'spot_funds' && r.user_id == select.user_id).forEach(async (room) => {
            
            let assets = await SpotFundsCalculate(wallets);
            sockets.in(room.token).emit('spot_funds', { page: "spot", type: 'funds', content: assets });
        });

        roomInUsers.filter((r) => r.process == 'assets' && r.user_id == select.user_id).forEach(async (room) => {
            let assets = await SpotAssetsCalculate(wallets);
            sockets.in(room.token).emit('assets', assets);
        });

        roomInUsers.filter((r) => r.process == 'assets_overview' && r.user_id == select.user_id).forEach(async (room) => {
            let assets = await SpotAssetsCalculate(wallets);
            let spotData = await SpotAssetsOverviewCalculate(wallets);
            let futureData = await FutureAssetsOverviewCalculate(select.user_id);
            sockets.in(room.token).emit("assets_overview", {
                "spot": spotData,
                "future": futureData
            });
        });





    });


    //Future Wallet
    FutureWalletModel.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let wallets = await FutureWalletModel.findOne({ _id: data.documentKey._id });


        roomInUsers.filter((r) => r.process == 'derivatives' && r.user_id == wallets.user_id).forEach(async (room) => {
            let assets = await DerivativesCalculate(wallets)
            sockets.in(room.token).emit('derivatives', assets);
        });


        roomInUsers.filter((r) => r.process == 'future_balance' && r.user_id == wallets.user_id).forEach(async (room) => {
            let balance = await calculateFutureBalance(wallets);
            sockets.in(room.token).emit('future_balance', { type: "future_balance", content: balance });
        });


        roomInUsers.filter((r) => r.process == 'future_assets' && r.user_id == wallets.user_id).forEach(async (room) => {
            let assets = await calculateFutureFund(wallets);
            sockets.in(room.token).emit("future_assets", { page: "future", type: 'assets', content: assets });
        });



    });


    FutureOrder.watch([{ $match: { operationType: { $in: ['insert', 'update'] } } }]).on('change', async data => {
        let releated = await FutureOrder.findOne({ _id: data.documentKey._id });

        roomInUsers.filter((r) => r.process == 'future_open_orders' && r.user_id == releated.user_id).forEach(async (room) => {
            let orders = await FutureOrder.find({ user_id: room.user_id, $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 });
            sockets.in(room.token).emit('future_open_orders', { page: "future", type: 'open_orders', content: orders });
        });


        roomInUsers.filter((r) => r.process == 'future_positions' && r.user_id == releated.user_id).forEach(async (room) => {
            let orders = await FutureOrder.find({
                user_id: room.user_id,
                method: "market",
                status: 0,
            });
            let assets = await GetFutureLiqPrice(orders);

            sockets.in(room.token).emit('future_positions', { page: "future", type: "positions", content: assets });
        });
    });


}

SocketWatchController();