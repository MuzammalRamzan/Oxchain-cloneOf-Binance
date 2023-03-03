const { default: mongoose } = require("mongoose");

const OrderBookModel = mongoose.Schema({
    symbol : {type : String},
    buyLimit : {type : String},
    sellLimit : {type : String},
    buyPrice : {type: String},
    sellPrice : {type: String},
    created_at : {type: Date, default : Date.now()}
})

module.exports = mongoose.model("OrderBook", OrderBookModel);