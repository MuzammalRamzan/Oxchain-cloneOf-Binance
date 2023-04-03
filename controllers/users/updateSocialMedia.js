const checkTwitterAccount = require("../../Functions/checkTwitterAccount");
const User = require("../../models/User");
var authFile = require("../../auth.js");

const UpdateSocialMedia = async (req, res) => {

    let result = await authFile.apiKeyChecker(req.body.api_key);
    if (result != true)
        return res.json({ status: "fail", message: "Invalid api key" });

    let key = req.headers["key"];

    if (!key) {
        return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
        return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
        return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
        return res.json({ status: "fail", message: "invalid_key" });
    }

    let uid = req.body.user_id;
    let user = await User.findOne({ _id: uid });
    if (user == null)
        return res.json({ status: "fail", message: "User not found" });

    if (req.body.twitter_username != null) {
        let check = await checkTwitterAccount(req.body.twitter_username);
        if (check != 'ok') {
            return res.json({ status: "fail", message: check });
        }
        user.twitter_username = req.body.twitter_username;
    }
    if (req.body.facebook_username != null)
        user.facebook_username = req.body.facebook_username;
    if (req.body.instagram_username != null)
        user.instagram_username = req.body.instagram_username;

    await user.save();
    return res.json({ status: "success", data: "ok" });
}
module.exports = UpdateSocialMedia;