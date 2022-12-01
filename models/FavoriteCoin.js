const mongoose = require('mongoose');
const FavoriteCoin = new mongoose.Schema({
    user_id : {type : mongoose.Schema.Types.ObjectId, ref: "User", required : true},
    coin_id : {type : mongoose.Schema.Types.ObjectId, ref: "CoinList", required : true},

});

module.exports = mongoose.model("FavoriteCoin", FavoriteCoin);