const  mongoose  = require("mongoose");

const ContractAddressSchema = new mongoose.Schema({
    coin_id : {type : mongoose.Schema.Types.ObjectId, ref : "CoinList", required: true},
    network_id : {type : mongoose.Schema.Types.ObjectId, ref : "Network", required: true},
    contract : {type : String, required : true}

});
module.exports = mongoose.model("ContractAddress", ContractAddressSchema);