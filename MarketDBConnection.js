const mongoose = require('mongoose');
require('dotenv').config();
async function MarketDBConnection() {
    console.log("mongodb://" +
    process.env.MARKET_DB_UID
    + ":" +
    process.env.MARKET_DB_PASS
    + "@" + process.env.MARKETDBIP + "/?retryWrites=true&w=majority");
    await mongoose.connect("mongodb://" +
        process.env.MARKET_DB_UID
        + ":" +
        process.env.MARKET_DB_PASS
        + "@" + process.env.MARKETDBIP + "/?retryWrites=true&w=majority");
    console.log(mongoose.connection.readyState);
    console.log("Market DB Connected");
}
module.exports = MarketDBConnection;