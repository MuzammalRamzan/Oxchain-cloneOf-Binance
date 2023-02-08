const User = require("../../models/User");
const ApiKeys = require("../../models/ApiKeys");
var authFile = require("../../auth.js");
const SMSVerificationModel = require("../../models/SMSVerification");
const MailVerificationModel = require("../../models/MailVerification");
var mailer = require("../../mailer.js");
const VerificationIdModel = require("../../models/VerificationId");
const RecidencyModel = require("../../models/RecidencyModel");



const deleteApiKey = async function (req, res) {


    const { user_id, api_key } = req.body;

    if (!user_id || !api_key) {
        return res.json({ status: "fail", message: "Please fill all fields", showableMessage: "Please fill all fields" });
    }

    let result = await authFile.apiKeyChecker(api_key);

    if (result === false) {

        return res.json({ status: "fail", message: "Forbidden 403", showableMessage: "Forbidden 403" });
    }

    let user = await User.findOne({
        _id: user_id
    }).exec();

    if (!user) {
        return res.json({ status: "fail", message: "User not found", showableMessage: "User Not Found" });
    }

    let apiKey = await ApiKeys.find({
        user_id: user_id,
    }).exec();

    if (!apiKey) {

        return res.json({ status: "fail", message: "Api Key not found", showableMessage: "Api Key Not Found" });
    }

    //find all api keys and update status to 0
    await ApiKeys.updateMany({
        user_id: user_id,
    }, {
        $set: {
            status: 0
        }
    }).exec();

    return res.json({ status: "success", message: "Api Keys Deleted", showableMessage: "Api Keys Deleted" });

}

module.exports = deleteApiKey;