const Referral = require("../../models/Referral");
const UserRef = require("../../models/UserRef");

const GetUserLevel = async (req, res) => {
    let uid = req.body.user_id;
    if (uid == null || uid == '') {
        return res.json({ status: 'fail', message: 'User not found' });
    }

    let level = await subReferral(uid);

    return res.json({ status: "success", data: level });
}

const subReferral = async (user_id) => {
    let level = 0;
    let userRefCode = await UserRef.findOne({ user_id: user_id });
    let checkSubReference = await getReferralUsers(userRefCode.refCode);
    if (checkSubReference.length > 0) {
        level = 1;
        for (var k = 0; k < checkSubReference.length; k++) {
            level += await subReferral(checkSubReference[k].user_id);
        }
    }

    return level;
}

const getReferralUsers = async (refCode) => {
    let checkSubReference = await Referral.find({ reffer: refCode });
    if (checkSubReference == null) {
        return [];
    }
    return checkSubReference;
}

const initialData = async () => {
    while (levelCounter < 4) {
        let userRefCode = await UserRef.findOne({ user_id: parentUID });
        if (userRefCode == null) {
            break;
        }
        parentRefCode = userRefCode.refCode;
        let checkSubReference = await Referral.findOne({ reffer: parentRefCode });
        if (checkSubReference == null) {
            break;
        }
        level++;
        levelCounter++;
        parentUID = checkSubReference.user_id;
    }
}
module.exports = GetUserLevel;