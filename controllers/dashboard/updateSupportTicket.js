const SupportTickets = require("../../models/Tickets")
var authFile = require("../../auth.js");
// const User = require("../../models/User");
const Admin = require("../../models/Admin");



////status 0=open , 1=closed
const updateSupportTicket = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;
    var ticketStatus = req.body.status
    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {
        let user = await Admin.findOne({
            _id: user_id,
            status: 1,
        }).exec();
        console.log("user", user)
        if (!user) { return res.json({ status: "fail", message: "user_not_an_Admin", showableMessage: "User not have Permission to update" }); }

        const newData = await SupportTickets.findById(
            req.body.ticketID
        ).exec();
        console.log("newData", newData)
        if (newData?.length == 0) {
            await SupportTickets.findByIdAndUpdate(
                req.body.ticketID
                , {
                    status: ticketStatus,                   ////2 for delete
                }).exec();
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

module.exports = updateSupportTicket;