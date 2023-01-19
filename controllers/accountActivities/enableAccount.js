const UserModel = require('../../models/User');
const authFile = require('../../auth.js');
const MailVerification = require('../../models/MailVerification');
const PhoneVerification = require('../../models/SMSVerification');



const enableAccount = async function (req, res) {

    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);

    if (result === true) {
        let user = await UserModel.findOne({
            _id: user_id,
        }).exec();

        if (user != null) {

            var email = user["email"];
            var phone = user["phone_number"];
            console.log("email", email);
            console.log("phone", phone);

            let check1 = "";
            let check3 = "";


            if (email != undefined && email != null && email != "") {
                check1 = await MailVerification.findOne({
                    user_id: user_id,
                    reason: "enable_account",
                    pin: req.body.pin,
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
                check3 = await PhoneVerification.findOne
                    ({
                        user_id: user_id,
                        reason: "enable_account",
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

            if (check1 != "") {
                check1.status = 1;
                check1.save();
            }

            if (check3 != "") {
                check3.status = 1;
                check3.save();
            }


            user.status = 1;
            user.save();

            res.json({
                status: "success",
                message: "Account enabled successfully",
                showableMessage: "Account enabled successfully",
            });
        }
        else {

            res.json({
                status: "error",
                message: "User does not exist",
                showableMessage: "User does not exist",
            });

        }

    }
    else {

        res.json({
            status: "error",
            message: "Invalid API Key",
            showableMessage: "Invalid API Key",
        });

    }
}

module.exports = enableAccount;

