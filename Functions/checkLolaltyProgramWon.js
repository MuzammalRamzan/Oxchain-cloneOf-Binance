const LolaltyProgramModel = require("../models/LolaltyProgramModel");
const LolatlyWinnerModel = require("../models/LolatlyWinnerModel");
const Wallet = require("../models/Wallet");
const getTradeVolumes = require("./getTradeVolumes");

const checkLolaltyProgramWon = async (user_id)  => {
    
    let programs = await LolaltyProgramModel.find();
    for (var k = 0; k < programs.length; k++) {
        let program = programs[k];
        if (program.period == 'unlimited') {
            
            let volumes = await getTradeVolumes(user_id);
            if (volumes > 0) {
                if (volumes >= program.min_amount) {
                    let checkProgram = await _checkLolProgramWon(user_id, program._id);
                    if (!checkProgram) {
                        let add = new LolatlyWinnerModel({
                            user_id: user_id,
                            program_id: program._id,
                            total_usdt_volume: volumes,
                            reward: program.reward,
                            status: 1
                        });
                        await add.save();
                        if (!isNaN(program.reward)) {
                            let wallet = await Wallet.findOne({ user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" }) //get usdt wallet
                            wallet.amount += parseFloat(program.reward);
                            await wallet.save();
                            

                        }
                        
                    }
                }
            }
        }
    }
}

async function _checkLolProgramWon(user_id, program_id) {
    let check = await LolatlyWinnerModel.findOne({ user_id: user_id, program_id: program_id, status: { $gt: 0 } });
    return check != null;
}

module.exports = checkLolaltyProgramWon;