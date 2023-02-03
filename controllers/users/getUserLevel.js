const Referral = require("../../models/Referral");
const UserRef = require("../../models/UserRef");

const GetUserLevel = async (req, res) => {
    let uid = req.body.user_id;
    if (uid == null || uid == '') {
        return res.json({ status: 'fail', message: 'User not found' });
    }

    let level = 0;
    let levelCounter = 0;
    let parentUID = uid;
    let parentRefCode = null;
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

    return res.json({status : "success", data: level});
}

module.exports = GetUserLevel;