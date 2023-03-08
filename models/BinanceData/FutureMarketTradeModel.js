const { default: mongoose } = require("mongoose");

const FutureMarketTradeModel = mongoose.Schema({
    eventTime : {type : Number},
    symbol : {type : String},
    price : {type : Number, default : 0.0},
    amount : {type : Number, default : 0.0},
    isMaker : {type : Boolean},
    marketType : {type : String, default  : 'spot'}

})

module.exports = mongoose.model('FutureMarketTradeModel', FutureMarketTradeModel);