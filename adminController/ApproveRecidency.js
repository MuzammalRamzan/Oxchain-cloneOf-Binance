const UserModel = require('../models/User');

const Mailer = require('../mailer');

var authFile = require('../auth.js');
const RecidencyModel = require('../models/RecidencyModel');

const approveUser = async (req, res) => {

    const api_key = req.body.api_key;
    const user_id = req.body.user_id;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {
        const user = await UserModel.findOne({
            _id: user_id
        }).exec();

        if (user) {

            let Recidency = await RecidencyModel.findOne({
                user_id: user._id
            }).exec();

            if (Recidency) {
                Recidency.status = 1;
                await Recidency.save();

                if (user.email != null) {
                    Mailer.sendMail(user.email, "Account Approved", "Your recidency has been approved");
                }

                return res.json({
                    status: "success",
                    message: "User approved",
                    showableMessage: "User approved",
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

module.exports = approveUser;