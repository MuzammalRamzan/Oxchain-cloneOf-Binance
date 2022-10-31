const Referral = require("../../models/Referral");
const User = require("../../models/User");
const UserRef = require("../../models/UserRef");

const setFeeCredit =  async function(user_id, amount) {
    let getUser = await User.findOne({user_id : user_id});
    if(getUser == null) {
        return false;
    }

    let getUserRefCode = await UserRef.findOne({user_id : user_id});
    let getSubReferrals = await Referral.find({reffer : getUserRefCode.refCode}).sort({createdAt: -1});
    let counter = 1;
    for(var i = 0; i < getSubReferrals.length; i++) {
        switch(counter) {
            case 1 : 
            
            break;
        }
    }
}

module.exports = setFeeCredit;