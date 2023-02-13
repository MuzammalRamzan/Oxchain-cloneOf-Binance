const User = require("../../models/User");
var authFile = require("../../auth.js");
const MailVerificationModel = require("../../models/MailVerification");
const SMSVerificationModel = require("../../models/SMSVerification");

const update2fa = async function (req, res) {
    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;

    var result = await authFile.apiKeyChecker(api_key_result);

    if (result === true) {

        let UserData = await User.findOne({
            _id: user_id
        }).exec();

        if (UserData) {

            let phone = UserData.phone_number;
            let email = UserData.email;
            let twofa = UserData.twofa;
            let check1 = "";
            let check3 = "";

            if (UserData.twofa == null) {
                return res.json({ status: "fail", message: "2fa_not_enabled", showableMessage: "2FA Not Enabled" });
            }

            if (!email == undefined || !email == null || !email == "") {

                check1 = await MailVerificationModel.findOne({
                    user_id: user_id,
                    reason: "delete_2fa",
                    status: 0
                }).exec();

                if (!check1) {
                    return res.json({ status: "fail", message: "wrong_mail_pin", showableMessage: "Wrong Mail Pin" });
                }

            }

            if (!phone == undefined || !phone == null || !phone == "") {

                check3 = await SMSVerificationModel.findOne({
                    user_id: user_id,
                    reason: "delete_2fa",
                    status: 0
                }).exec();

                if (!check3) {
                    return res.json({ status: "fail", message: "wrong_sms_pin", showableMessage: "Wrong SMS Pin" });
                }
            }


            if (twofa != undefined && twofa != null && twofa != "") {

                if (req.body.twofapin == undefined || req.body.twofapin == null || req.body.twofapin == "") {
                    return res.json({ status: "fail", message: "verification_failed, send 'twofapin'", showableMessage: "Wrong 2FA Pin" });
                }

                let resultt = await authFile.verifyToken(req.body.twofapin, twofa);

                if (resultt === false) {
                    return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong 2FA Pin" });
                }
            }

            if (check1 != "") {
                check1.status = 1;
                check1.save();
            }

            if (check3 != "") {
                check3.status = 1;
                check3.save();
            }

            UserData.twofa = null;

            UserData.save((err, doc) => {
                if (err) {
                    console.log(err);
                    res.json({ status: "fail", message: err });
                }
                else {
                    res.json({ status: "success", data: "2fa_deleted", showableMessage: "2FA Deleted" });
                }
            });
        } else {
            res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
        }
    };
};

module.exports = update2fa;
