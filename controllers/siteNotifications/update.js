const SiteNotificationsModel = require('../../models/SiteNotifications');
var authFile = require("../../auth.js");


const update = async (req, res) => {

    let user_id = req.body.user_id;
    let api_key = req.body.api_key;


    if (user_id == null || api_key == null) {

        return res.json({ status: "error", message: "Missing user_id or api_key", showableMessage: "Missing user_id or api_key" })

    }

    let result = await authFile.apiKeyChecker(api_key);


    if (result == true) {

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

        let check = await SiteNotificationsModel
            .findOne({ user_id: user_id })
            .exec();

        if (check == null) {

            return res.json({ status: "error", message: "No user found", showableMessage: "No user found" })

        } else {

            let activities = req.body.activities;
            let trade = req.body.trade;
            let news = req.body.news;
            let system_messages = req.body.system_messages;

            if (activities == null || trade == null || news == null || system_messages == null) {

                return res.json({ status: "error", message: "Missing activities, trade, news or system_messages", showableMessage: "Missing activities, trade, news or system_messages" })

            }

            let update = await SiteNotificationsModel.findOneAndUpdate({ user_id: user_id }, {
                activities: activities,
                trade: trade,
                news: news,
                system_messages: system_messages,
            });

            return res.json({ status: "success", message: "Updated", showableMessage: "Updated" })

        }

    }

};


module.exports = update;