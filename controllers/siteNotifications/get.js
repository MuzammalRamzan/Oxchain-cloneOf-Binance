const SiteNotificationsModel = require('../../models/SiteNotifications');
var authFile = require("../../auth.js");


const get = async (req, res) => {

    let user_id = req.body.user_id;
    let api_key = req.body.api_key;


    if (user_id == null || api_key == null) {

        return res.json({ status: "error", message: "Missing user_id or api_key", showableMessage: "Missing user_id or api_key" })

    }

    let result = await authFile.apiKeyChecker(api_key);


    if (result == true) {

        let check = await SiteNotificationsModel
            .findOne({ user_id: user_id })
            .exec();

        if (check == null) {
            return res.json({ status: "error", message: "No user found", showableMessage: "No user found" })
        }

        return res.json({ status: "success", message: "Found", showableMessage: "Found", data: check })
    }
}



module.exports = get;