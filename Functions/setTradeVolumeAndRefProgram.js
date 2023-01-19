const checkLolaltyProgramWon = require("./checkLolaltyProgramWon");
const getTradeVolumes = require("./getTradeVolumes");
const TradeVolumeModel = require("../models/TradeVolumeModel");

const SetTradeVolumeAndRefProgram = async (tradeData) => {
    console.log("trade ", tradeData.trade_type, " total usdt : ", tradeData.totalUSDT);
    let addVolume = new TradeVolumeModel(tradeData);
    await addVolume.save();
    let volumes = await getTradeVolumes(tradeData.user_id);
    console.log("------------------------------------------------");
    console.log("Total Trade Volume : ", volumes + " USDT");
    console.log("------------------------------------------------");
    checkLolaltyProgramWon(tradeData.user_id);
    
}

module.exports = SetTradeVolumeAndRefProgram;