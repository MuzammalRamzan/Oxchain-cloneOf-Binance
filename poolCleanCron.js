const SocketRoomsModel = require("./models/SocketRoomsModel");

async function PoolCleanCron() {
    try {
        let dt = new Date();
        dt.setDate(dt.getDate() - 1);
        let yesterday = dt.getTime();
        console.log({ created_at: { $lt: yesterday } });
        let data = await SocketRoomsModel.find({ created_at: { $gt: yesterday } });
        console.log(yesterday);
        console.log(data);
    } catch(err) {
        console.log(err);
    }
}
PoolCleanCron();