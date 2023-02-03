const TradeVolumeModel = require("../models/TradeVolumeModel");
const get4LevelReferralUsers = require("./get4LevelReferralUsers");

const getSpotTradeVolume = async(user_id)  => {
    
    let volumes = await TradeVolumeModel.aggregate([
        {
            $group: {
                _id: "$user_id",
                totalUSDT: { $sum: "$totalUSDT" }
            }
        }
    ]);
    let total = 0;
    let users = await get4LevelReferralUsers(user_id);
    for(var k = 0; k < volumes.length; k++) {
        if(users.indexOf(volumes[k]._id.toString()) != null) {
            total += parseFloat(volumes[k].totalUSDT);
        }
    }
    return total;
}

module.exports = getSpotTradeVolume;