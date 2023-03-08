const { default: mongoose } = require("mongoose");

const MarketTradeModel = mongoose.Schema({
    eventTime : {type : Number},
    symbol : {type : String},
    price : {type : Number, default : 0.0},
    amount : {type : Number, default : 0.0},
    isMaker : {type : Boolean},
    marketType : {type : String, default  : 'spot'}

})

module.exports = mongoose.model('MarketTradeModel', MarketTradeModel);