const User = require("../../models/User");
const ApiKeys = require("../../models/ApiKeys");
var authFile = require("../../auth.js");
const SMSVerificationModel = require("../../models/SMSVerification");
const MailVerificationModel = require("../../models/MailVerification");
var mailer = require("../../mailer.js");
const VerificationIdModel = require("../../models/VerificationId");
const RecidencyModel = require("../../models/RecidencyModel");




const addNewApiKey = async function (req, res) {


    const { user_id, trade, deposit, withdraw, transfer, get_balance, futures, tag, api_key } = req.body;



    const apiKeyChecker = await authFile.apiKeyChecker(api_key);
    if (!apiKeyChecker) {
        return res.json({ status: "fail", message: "Forbidden 403", showableMessage: "Forbidden 403" });
    }

    if (!user_id || !trade || !deposit || !withdraw || !transfer || !get_balance || !futures || !tag) {
        return res.json({ status: "fail", message: "Please fill all fields", showableMessage: "Please fill all fields" });
    }

    const user = await User.findOne({
        _id: user_id
    }).exec();

    if (!user) {
        return res.json({ status: "fail", message: "User not found", showableMessage: "User Not Found" });
    }


    let VerificationCheck = await VerificationIdModel.findOne({
        user_id: user_id,
        status: 1,
    }).exec();

    if (!VerificationCheck) {
        return res.json({ status: "fail", message: "Please verify your identity first", showableMessage: "Your ID must be verified to create an API Key." });
    }

    let RecidencyCheck = await RecidencyModel.findOne({
        user_id: user_id,
        status: 1,
    }).exec();

    if (!RecidencyCheck) {
        return res.json({ status: "fail", message: "Please verify your recidency first", showableMessage: "Your Recidency must be verified to create an API Key." });
    }


    var email = user["email"];
    var phone = user["phone_number"];
    var twofa = user["twofa"];

    let check1 = "";
    let check3 = "";

    if (email != undefined && email != null && email != "") {
        if (!req.body.mailPin) return res.json({ status: "fail", message: "Please fill all fields", showableMessage: "Please fill all fields" });
        check1 = await MailVerificationModel.findOne({
            user_id: user_id,
            reason: "create_api_key",
            pin: req.body.mailPin,
            status: 0,
        }).exec();

        console.log("check1", check1);
        if (!check1) {
            return res.json({
                status: "fail",
                message: "verification_failed",
                showableMessage: "Wrong Mail Pin",
            });
        }
    }

    if (phone != undefined && phone != null && phone != "") {
        if (!req.body.smsPin) return res.json({ status: "fail", message: "Please fill all fields", showableMessage: "Please fill all fields" });

        check3 = await SMSVerificationModel.findOne
            ({
                user_id: user_id,
                reason: "create_api_key",
                pin: req.body.smsPin,
                status: 0,
            }).exec();

        console.log("check3", check3);

        if (!check3) {
            return res.json({
                status: "fail",
                message: "verification_failed",
                showableMessage: "Wrong SMS Pin",
            });
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


    let newApiKey = "";

    do {
        newApiKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    } while (await ApiKeys.findOne({
        api_key: newApiKey
    }).exec());

    let NewApiKey = new ApiKeys({
        api_key: newApiKey,
        user_id: user_id,
        trade: trade,
        deposit: deposit,
        withdraw: withdraw,
        transfer: transfer,
        get_balance: get_balance,
        futures: futures,
        tag: tag,
        status: 1
    });

    NewApiKey.save(function (err, result) {
        if (err) {
            return res.json({ status: "fail", message: "Error", showableMessage: "Error" });
        }
        mailer.sendMail(email, "New API Key Created", "New API Key Created", "A new API key has been created for your account. If you did not create this API key, please contact support immediately.");
        return res.json({ status: "success", message: "Success", showableMessage: "API key added successfully" });
    });


};



module.exports = addNewApiKey;
