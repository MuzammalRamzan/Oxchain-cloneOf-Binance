var authFile = require("../../auth.js");
const Bonus = require("../../models/Bonus");
const getBonusHistory = async (req, res) => {
    
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);
    if(result != false) {
         res.json({'status' : false, 'message' : 'Not auth'});
         return;
    }

    let user_id = req.body.user_id;
    let list = await Bonus.find({user_id : user_id}).exec();
    res.json({'status' : true, 'data' : list});
}

module.exports = getBonusHistory;