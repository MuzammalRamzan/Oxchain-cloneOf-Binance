const Referral = require("../models/Referral");
const UserRef = require("../models/UserRef");

const get4LevelReferralUsers = async(user_id) => {
    
    let userRefCode = await UserRef.findOne({user_id: user_id});
    if(userRefCode != null) {
        let subUsers = await Referral.find({reffer: userRefCode.refCode});
        subUsers.reverse();
        if(subUsers.length > 4) {
            subUsers = subUsers.slice(0,3);
        }
        return subUsers.map(u => u.user_id);;
    }
    return [];
}

module.exports = get4LevelReferralUsers;