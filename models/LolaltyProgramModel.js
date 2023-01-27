const { default: mongoose } = require("mongoose");

const LolaltyProgramModel = mongoose.Schema({
    title: {type : String, required: true}, //Program title
    min_amount : {type : Number, required : true}, //The amount required to win the prize
    period: {type : String, required: true, default : "unlimited"}, //period to be processed : daily, weekly, monthly, unlimited calc
    reward : {type: String, required: true},
});
module.exports = mongoose.model("LolaltyProgram", LolaltyProgramModel);