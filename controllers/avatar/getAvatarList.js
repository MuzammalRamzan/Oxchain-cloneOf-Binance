const avatarModel = require('../../models/AvatarList');
var authFile = require("../../auth.js");

const getAvatarList = async (req, res) => {

    let api_key = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key);

    if (result === true) {
        let avatarList = await avatarModel.find({
            status: 1
        }).exec();
        res.json({ status: "success", message: "avatar_list", data: avatarList });
    }
    else {
        res.json({ status: "fail", message: "Forbidden 403" });
    }
};

module.exports = getAvatarList;