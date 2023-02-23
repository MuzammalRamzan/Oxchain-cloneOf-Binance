const SupportTickets = require("../models/Tickets")
var authFile = require("../auth.js");
const Admin = require("../models/Admin");
const SupportTeam = require("../models/supportTeam")


////status 0=open , 1=closed ,2=delete
const updateSupportTicket = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;
    var ticketStatus = req.body.status
    var result = await authFile.apiKeyChecker(api_key_result);

    if (result === true) {
        let user = await SupportTeam.findOne({
            _id: user_id,
            status: 1,
        }).exec();
        if (!user) { return res.json({ status: "fail", message: "user_not_authorized", showableMessage: "User not have Permission to update" }); }

        const newData = await SupportTickets.findById(
            req.body.ticketID
        ).exec();
        if (newData?.length != 0) {
            if (ticketStatus > 2 || ticketStatus < 0) {
                return res.json({ status: "success", message: "Ticket is not Updated", showableMessage: "Please provide status (0-2)" });
            }
            newData.status = ticketStatus
            newData.save()
            return res.json({ status: "success", message: "Ticket is Updated", Ticket: newData });

        }
        else {
            return res.json({ status: "success", message: "no ticket found", showableMessage: "no ticket found" });
        }
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }

};

module.exports = updateSupportTicket;