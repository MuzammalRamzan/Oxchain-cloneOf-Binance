const checkLolaltyProgramWon = require("./checkLolaltyProgramWon");
const getTradeVolumes = require("./getTradeVolumes");
const TradeVolumeModel = require("../models/TradeVolumeModel");

const SetTradeVolumeAndRefProgram = async (tradeData) => {
    let addVolume = new TradeVolumeModel(tradeData);
    await addVolume.save();
  // await getTradeVolumes(tradeData.user_id);
  
    checkLolaltyProgramWon(tradeData.user_id);
    
}

module.exports = SetTradeVolumeAndRefProgram;