const avatarModel = require('../../models/AvatarList');
var authFile = require("../../auth.js");

const getAvatarList = async (req, res) => {

    let api_key = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let key = req.headers["key"];

        if (!key) {
            return res.json({ status: "fail", message: "key_not_found" });
        }

        if (!req.body.device_id || !req.body.user_id) {
            return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
        }

        let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


        if (checkKey === "expired") {
            return res.json({ status: "fail", message: "key_expired" });
        }

        if (!checkKey) {
            return res.json({ status: "fail", message: "invalid_key" });
        }

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