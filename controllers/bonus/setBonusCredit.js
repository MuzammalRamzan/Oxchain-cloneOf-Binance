const FeeModel = require("../../models/FeeModel");
const Referral = require("../../models/Referral");
const User = require("../../models/User");
const UserRef = require("../../models/UserRef");
const Wallet = require("../../models/Wallet");

const setBonusCredit = async function (user_id, pair_id, amount) {
    let getUser = await User.findOne({ user_id: user_id });
    if (getUser == null) {
        return false;
    }

    let getUserRefCode = await UserRef.findOne({ user_id: user_id });
    let parentReferralCounter = 0;
    let percentAmount = 20;
    let searchUserId = user_id;
    while (parentReferralCounter < 4) {
        
        let getParentReferral = await Referral.findOne({ user_id: searchUserId });
        if (getParentReferral == null) {
            //console.log(searchUserId, " bulunamadı");
            return;
        }
        let parentRefCode = getParentReferral.reffer;
        let getRefferUser = await UserRef.findOne({ refCode: parentRefCode });

        let insertAmount = amount * percentAmount / 100.0;
        if(insertAmount < 0) continue;
        console.log(parentReferralCounter, " | ", percentAmount, " | ", insertAmount);
        let getWallet = await Wallet.findOne({ user_id: getRefferUser.user_id, coin_id: pair_id });

        getWallet.totalBonus = parseFloat(getWallet.totalBonus) + insertAmount;
        await getWallet.save();
        let insertFeeTable = new FeeModel({
            feeType: "trade",
            amount: insertAmount,
            from_user_id: searchUserId,
            to_user_id: getRefferUser.user_id,
            pair_id: pair_id,
            status: 1
        })
        await insertFeeTable.save();
        searchUserId = getRefferUser.user_id;
        switch (parentReferralCounter) {
            case 0: percentAmount = 10; break;
            default:
                percentAmount = 5;
                break;
        }
        
        parentReferralCounter++;
    }
    console.log("Success");
    return ;
}

module.exports = setBonusCredit;