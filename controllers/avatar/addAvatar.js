const avatarModel = require('../../models/AvatarList');
var authFile = require("../../auth.js");

const addAvatar = async (req, res) => {

    let api_key = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key);

    if (result === true) {
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