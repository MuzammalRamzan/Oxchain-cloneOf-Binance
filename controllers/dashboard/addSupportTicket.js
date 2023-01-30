const SupportTickets = require("../../models/Tickets")
var authFile = require("../../auth.js");
const User = require("../../models/User");


////status 0=open , 1=closed   2=delete
const addSupportTicket = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;

    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {
        let user = await User.findOne({
            _id: user_id,
            status: 1,
        }).exec();
        if (!user) { return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" }); }

        let check1 = await SupportTickets.findOne({
            user_id: req.body.user_id,
            title: req.body.title,
            message: req.body.message,
            status: 0,
        }).exec();
        if (check1) { return res.json({ status: "fail", message: "Ticket already generated", showableMessage: "Ticket already generated" }) }
        const newData = new SupportTickets({
            user_id: req.body.user_id,
            title: req.body.title,
            message: req.body.message,
            status: 0,
        });

        newData.save().then(() => {
            res.json({ status: "success", message: "Ticket generated", showableMessage: "Ticket generated" });
        });
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }

};

module.exports = addSupportTicket;