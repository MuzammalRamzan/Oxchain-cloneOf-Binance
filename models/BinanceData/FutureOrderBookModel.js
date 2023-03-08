const { default: mongoose } = require("mongoose");

const FutureOrderBookModel = mongoose.Schema({
    symbol : {type : String},
    buyLimit : {type : String},
    sellLimit : {type : String},
    buyPrice : {type: String},
    sellPrice : {type: String},
    market_type : {type: String}, //spot or future
    created_at : {type: Date, default : Date.now()}
})

module.exports = mongoose.model("FutureOrderBook", FutureOrderBookModel);