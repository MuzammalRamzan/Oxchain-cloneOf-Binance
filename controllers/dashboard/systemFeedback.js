const SupportTickets = require("../../models/Tickets")
var authFile = require("../../auth.js");
const User = require("../../models/User");
const SystemFeedback = require("../../models/SystemFeedback");


const addSystemFeedback = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;
    var rating = req.body.rating;
    var comments = req.body.comments
    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {
        let user = await User.findOne({
            _id: user_id,
            status: 1,
        }).exec();
        if (!user) { return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" }); }

        let check1 = await SystemFeedback.findOne({
            user_id: user_id,
            rating: rating,
            comments: comments,
            status: 0,
        }).exec();
        if (check1) { return res.json({ status: "fail", message: "feedback_already_recieved", showableMessage: "Already recieved same feedback" }) }
        const newFeedback = new SystemFeedback({
            user_id: user_id,
            rating: rating,
            comments: comments,
            status: 0,
        });

        newFeedback.save().then(() => {
            res.json({ status: "success", message: "feedback_received", showableMessage: "Feedback received successfully" });
        });
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }

};

module.exports = addSystemFeedback;