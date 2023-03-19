const avatarModel = require('../../models/AvatarList');
var authFile = require("../../auth.js");

const addAvatar = async (req, res) => {

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
        const newAvatar = new avatarModel({
            url: req.body.url,
        });
        if (newAvatar.save()) {
            res.json({ status: "success", message: "avatar_added" });
        } else {
            res.json({ status: "fail", message: "an_error_occured" });
        }
    }
    else {
        res.json({ status: "fail", message: "Forbidden 403" });
    }
};

module.exports = addAvatar;