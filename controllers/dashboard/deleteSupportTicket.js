const SupportTickets = require("../../models/Tickets")
var authFile = require("../../auth.js");
const User = require("../../models/User");



////status 0=open , 1=closed   2=deleted
const deleteSupportTicket = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;

    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {

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


        let user = await User.findOne({
            _id: user_id,
            status: 1,
        }).exec();
        if (!user) { return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" }); }

        let check1 = await SupportTickets.findById({ _id: req.body.ticketID }).exec();
        if (!check1) {
            return res.json({ status: "success", message: "no ticket found", showableMessage: "no ticket found" });
        }
        else {
            await SupportTickets.findByIdAndUpdate(
                req.body.ticketID
                , {
                    status: 2,                   ////2 for delete
                }).exec();
            return res.json({ status: "success", message: "Ticket Deleted", showableMessage: "Ticket Deleted" });
        }
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }

};

module.exports = deleteSupportTicket;