const UserModel = require('../../models/User');

var authFile = require('../../auth');
const mailer = require('../../mailer');
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");



const removePhone = async (req, res) => {

    let user_id = req.body.user_id;
    let api_key = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key);

    if (result == true) {

        if (user_id == null || user_id == "") {
            return res.json({ status: "error", message: "user_id is null" });
        }

        let user = await UserModel.findOne(
            {
                _id: user_id
            }
        );

        if (user == null) {
            return res.json({ status: "error", message: "user is null" });
        }

        if (user.email == null || user.email == "") {

            return res.json({ status: "error", message: "user email is null", showableMessage: "You can't remove your phone number before adding email" });
        }
        else {


            let email = user.email;
            let phone = user.phone_number;
            let twofa = user.twofa;

            let check1 = "";
            let check3 = "";


            if (email != undefined && email != null && email != "") {
                check1 = await MailVerification.findOne({
                    user_id: user_id,
                    reason: "remove_phone",
                    pin: req.body.mailPin,
                    status: 0,
                }).exec();
                if (!check1)
                    return res.json({
                        status: "fail",
                        message: "verification_failed",
                        showableMessage: "Wrong Mail Pin",
                    });
            }

            if (phone != undefined && phone != null && phone != "") {
                check3 = await SMSVerification.findOne
                    ({
                        user_id: user_id,
                        reason: "remove_phone",
                        pin: req.body.smsPin,
                        status: 0,
                    }).exec();

                if (!check3)
                    return res.json({
                        status: "fail",
                        message: "verification_failed",
                        showableMessage: "Wrong SMS Pin",
                    });
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



            user.phone_number = null;
            user.country_code = null;
            user.save();
            mailer.sendMail(user.email, "Phone number removed", "Phone number removed", "Your phone number has been removed. If you did not do this, please contact us immediately.");
            return res.json({ status: "success", message: "phone number removed", showableMessage: "Phone number removed" });
        }
    }
    else {
        res.json("error");
    }

};

module.exports = removePhone;