const Connection = require("./Connection");
const SocketRoomsModel = require("./models/SocketRoomsModel");
require("dotenv").config();
async function PoolCleanCron() {
    try {

        await Connection.connection()
        let dt = new Date();
        dt.setDate(dt.getDate() - 1);
        let yesterday = dt.getTime();
        let data = await SocketRoomsModel.find({ created_at: { $lt: yesterday } });
        data.forEach(async datum => {
            await datum.delete();
        })
    } catch(err) {
        console.log(err);
    }
}
PoolCleanCron();