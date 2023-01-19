const LolaltyProgramModel = require("../../models/LolaltyProgramModel");
const LolatlyWinnerModel = require("../../models/LolatlyWinnerModel");
const TradeVolumeModel = require("../../models/TradeVolumeModel")

const SetTradeVolumeAndRefProgram = async (tradeData) => {
    console.log(tradeData);
    let addVolume = new TradeVolumeModel(tradeData);
    await addVolume.save();
    checkLolaltyProgramWon(tradeData.user_id);
}

async function checkLolaltyProgramWon(user_id) {
    let programs = await LolaltyProgramModel.find();
    for (var k = 0; k < programs.length; k++) {
        let program = programs[k];
        if (program.period == 'unlimited') {
            let volumes = await getTradeVolumes(user_id);
            if(volumes.length > 0) {
                if(volumes[0].totalUSDT >= program.min_amount) {
                    let checkProgram = await checkLolProgramWon(user_id, program._id);
                    if(!checkProgram ) {
                        let add = new LolatlyWinnerModel({
                            user_id : user_id,
                            program_id : program._id,
                            total_usdt_volume : volumes[0].totalUSDT,
                            selected_reward : "",
                            status : 0
                        });
                        await add.save();
                    }
                }
            }
        }
    }
}

async function getTradeVolumes(user_id) {
    let volumes = await TradeVolumeModel.aggregate([
        {
            $group: {
                _id : "$user_id",
                totalUSDT: { $sum: "$totalUSDT" }
            }
        }
    ]);
    return volumes.filter((x) => x._id == user_id);
}

async function checkLolProgramWon(user_id, program_id) {
    let check = await LolatlyWinnerModel.findOne({user_id : user_id, program_id : program_id, status : {$gt : 0}});
    return check != null;
}

module.exports = SetTradeVolumeAndRefProgram;