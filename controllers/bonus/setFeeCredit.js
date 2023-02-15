const FeeModel = require("../../models/FeeModel");
const Referral = require("../../models/Referral");
const User = require("../../models/User");
const UserRef = require("../../models/UserRef");
const Wallet = require("../../models/Wallet");

const setFeeCredit = async function (user_id, pair_id, amount) {
    amount = splitLengthNumber(amount);
    let getUser = await User.findOne({ user_id: user_id });
    if (getUser == null) {
        return false;
    }

    let getUserRefCode = await UserRef.findOne({ user_id: user_id });
    let parentReferralCounter = 0;
    let percentAmount = 20;
    let searchUserId = user_id;
    while (parentReferralCounter < 4 && parentReferralCounter > -1) {
        let getParentReferral = await Referral.findOne({ user_id: searchUserId });
        if (getParentReferral == null) {
            //console.log(searchUserId, " bulunamadı");
            parentReferralCounter++;
            return;
        }
        let parentRefCode = getParentReferral.reffer;

        let getRefferUser = await UserRef.findOne({ refCode: parentRefCode });
        let insertAmount = amount * percentAmount / 100.0;
        
        if(insertAmount <= 0) return;
        let getWallet = await Wallet.findOne({ user_id: getRefferUser.user_id, coin_id: pair_id });
        if(getWallet == null) {
            parentReferralCounter++;
            continue;
        }
        getWallet.totalBonus = parseFloat(getWallet.totalBonus) + insertAmount;
        await getWallet.save();
        let insertFeeTable = new FeeModel({
            feeType: "trade",
            amount: insertAmount,
            from_user_id: searchUserId,
            to_user_id: getRefferUser.user_id,
            pair_id: pair_id,
            status: 1
        });
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
    return ;
    let getSubReferrals = await Referral.find({ reffer: getUserRefCode.refCode }).sort({ createdAt: -1 });
    let counter = 1;
    let writeAmount = 0.0;
    let wallet = null;
    let insert = null;
    for (var i = 0; i < getSubReferrals.length; i++) {
        let to_user_id = getSubReferrals[i].user_id;
        switch (counter) {
            case 1:
                writeAmount = amount * 20 / 100.0;
                wallet = await Wallet.find({ user_id: to_user_id, coin_id: pair_id });
                wallet.amount = parseFloat(wallet.amount) + writeAmount;
                await wallet.save();
                insert = new FeeModel({
                    feeType: "trade",
                    amount: writeAmount,
                    from_user_id: from_user_id,
                    to_from_user_id: to_user_id,
                    pair_id: pair_id,
                    status: 1
                });
                await insert.save();
                break;

            case 2:
                writeAmount = amount * 10 / 100.0;
                wallet = await Wallet.find({ user_id: to_user_id, coin_id: pair_id });
                wallet.amount = parseFloat(wallet.amount) + writeAmount;
                await wallet.save();
                insert = await new FeeModel({
                    feeType: "trade",
                    amount: writeAmount,
                    from_user_id: from_user_id,
                    to_from_user_id: to_user_id,
                    pair_id: pair_id,
                    status: 1
                });
                await insert.save();
                break;

            case 3:
                writeAmount = amount * 5 / 100.0;
                wallet = await Wallet.find({ user_id: to_user_id, coin_id: pair_id });
                wallet.amount = parseFloat(wallet.amount) + writeAmount;
                await wallet.save();
                insert = await new FeeModel({
                    feeType: "trade",
                    amount: writeAmount,
                    from_user_id: from_user_id,
                    to_from_user_id: to_user_id,
                    pair_id: pair_id,
                    status: 1
                });
                await insert.save();
                break;

            case 4:
                writeAmount = amount * 5 / 100.0;
                wallet = await Wallet.find({ user_id: to_user_id, coin_id: pair_id });
                wallet.amount = parseFloat(wallet.amount) + writeAmount;
                await wallet.save();
                insert = await new FeeModel({
                    feeType: "trade",
                    amount: writeAmount,
                    from_user_id: from_user_id,
                    to_from_user_id: to_user_id,
                    pair_id: pair_id,
                    status: 1
                });
                await insert.save();
                break;
        }
    }
}
function splitLengthNumber(q) {
    return q.toString().length > 6 ? parseFloat(q.toString().substring(0, 6)) : q;
  }
module.exports = setFeeCredit;