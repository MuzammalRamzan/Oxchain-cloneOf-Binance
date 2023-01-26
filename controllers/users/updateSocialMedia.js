const checkTwitterAccount = require("../../Functions/checkTwitterAccount");
const User = require("../../models/User");

const UpdateSocialMedia = async (req, res) => {
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