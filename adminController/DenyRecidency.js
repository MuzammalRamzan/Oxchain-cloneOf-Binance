const UserModel = require('../models/User');
const VerificationIdModel = require('../models/RecidencyModel');

const Mailer = require('../mailer');

var authFile = require('../auth.js');

const denyUser = async (req, res) => {

    const api_key = req.body.api_key;
    const user_id = req.body.user_id;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {
        const user = await UserModel.findOne({
            _id: user_id
        }).exec();

        if (user) {
            let verification = await VerificationIdModel
                .findOne({
                    user_id: user._id
                })
                .exec();

            if (verification) {

                verification.status = 2;
                await verification.save();

                if (user.email != null) {
                    Mailer.sendMail(user.email, "Account Denied", "Your account has been denied. Please upload a valid ID");
                }

                return res.json({
                    status: "success",
                    message: "User denied",
                    showableMessage: "User denied",
                });
            }
            else {
                return res.json({
                    status: "error",
                    message: "Application not found",
                    showableMessage: "Application not found",
                });
            }

        } else {
            res.json({
                status: "error",
                message: "User not found",
                showableMessage: "User not found",
            });
        }

    } else {

        res.json({
            status: "error",
            message: "Invalid API Key",
            showableMessage: "Invalid API Key",
        });
    }
};

module.exports = denyUser;