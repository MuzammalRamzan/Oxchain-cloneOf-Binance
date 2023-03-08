const { default: mongoose } = require("mongoose");

const FutureQuoteModel = mongoose.Schema({
    symbol : {type : String},
    lastPrice : {type : String},
    bid : {type : String},
    ask : {type : String},  
    open : {type : String},  
    high : {type : String},  
    low : {type : String},  
    close : {type : String},  
    change : {type : String},  
    changeDiff : {type : String},  
    volume : {type : String},  
    market_type : {type: String}, //spot or future
})

module.exports = mongoose.model("FutureQuoteModel", FutureQuoteModel);