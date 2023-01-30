const SupportTickets = require("../../models/Tickets")
var authFile = require("../../auth.js");
const User = require("../../models/User");



////status 0=open , 1=closed   2=delete

const getSupportTicket = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;

    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {
        let user = await User.findOne({
            _id: user_id,
            status: 1,
        }).exec();
        if (!user) { return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" }); }

        const newData = await SupportTickets.find({
            user_id: req.body.user_id, status: { $in: ["0", "1"] }
        });
        if (newData.length == 0) {
            return res.json({ status: "success", message: "no ticket found", showableMessage: "no ticket found" });
        }
        else {
            return res.json({ status: "success", message: "Success", Tickets: newData });
        }
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }

};

module.exports = getSupportTicket;