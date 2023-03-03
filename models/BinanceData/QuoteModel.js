const { default: mongoose } = require("mongoose");

const QuoteModel = mongoose.Schema({
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
})

module.exports = mongoose.model("QuoteModel", QuoteModel);