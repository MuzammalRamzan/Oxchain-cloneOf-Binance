const SupportTickets = require("../../models/Tickets")
var authFile = require("../../auth.js");
const User = require("../../models/User");
const uploadImage = require('../../adminController/Posts/uploadImage');
const RegisterMail = require("../../models/RegisterMail");


////status 0=open , 1=closed   2=delete
const addSupportTicket = async (req, res) => {
    try {
        const { file, fileExt } = req.body;

        var api_key_result = req.body.api_key;
        var user_id = req.body.user_id;
        let coverImageUrl = null;
        if (file && fileExt) {
            coverImageUrl = await uploadImage(file, fileExt);
        }
        var result = await authFile.apiKeyChecker(api_key_result);
        if (result === true) {
            let user = await User.findOne({
                _id: user_id,
                status: 1,
            }).exec();
            if (!user) { return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" }); }
            // let checkMail = await RegisterMail.findOne({
            //     email: req.body.registeredEmail,
            // });
            // if (!checkMail) {
            //     return res.status(400).json({ status: "fail", message: "Registerd_email_not_Found", showableMessage: "Registered Email not Found" })
            // }
            // let checkPhone = await UserModel.findOne({
            //     country_code: country_code,
            //     phone_number: phone_number,
            //   }).exec();

            //   if (!checkPhone) {
            //     return res.json({
            //       status: "fail",
            //       message: "phone_not_registered",
            //       showableMessage: "Phone not registered",
            //     });
            //   }
            let check1 = await SupportTickets.findOne({
                user_id: req.body.user_id,
                issueType: req.body.issueType,
                email: req.body.email,
                subject: req.body.subject,
                description: req.body.description,
                status: 0,
            }).exec();
            if (check1) { return res.json({ status: "fail", message: "Ticket already generated", showableMessage: "Ticket already generated" }) }

            const newData = new SupportTickets({
                user_id: req.body.user_id,
                issueType: req.body.issueType,
                email: req.body.email,
                registeredEmailOrPhone: req.body.registeredEmail,
                subject: req.body.subject,
                description: req.body.description,
                priority: req.body.priority,
                attachment: coverImageUrl,
                accountIssue: req.body.accountIssue,
                fa: req.body.fa,
                deposit: req.body.deposit,
                withdraw: req.body.withdraw,
                suspiciousCase: req.body.suspiciousCase,
                spotTrading: req.body.spotTrading,
                p2p: req.body.p2p,
                status: 0,
            });

            newData.save().then(() => {
                res.json({ status: "success", message: "Ticket generated", showableMessage: "Ticket generated" });
            }).catch((error) => {
                res.json({ status: "failed", message: error.message, showableMessage: "Ticket generated failed" });
            })
        }
        else {
            return res.json({ status: "failed", message: "403 Forbidden", showableMessage: "403 Forbidden" });
        }

    }
    catch (error) {
        return res.status(500).json({
            status: 'failed',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }

};

module.exports = addSupportTicket;