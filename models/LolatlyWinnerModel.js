const { default: mongoose } = require("mongoose");

const LolaltyWinnerModel = mongoose.Schema({
    user_id : {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    program_id : {type: mongoose.Schema.Types.ObjectId, ref: "LolaltyProgram", required: true},  //id of the program won
    total_usdt_volume : {type: Number, required: true}, //transaction volume (usdt amount)
    reward : {type: String, required: true}, 
    status : {type: Number, required: true}, //0 = disable, 1 = approved reward
});
module.exports = mongoose.model("LolaltyWinner", LolaltyWinnerModel);