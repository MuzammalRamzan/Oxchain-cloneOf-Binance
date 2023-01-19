const VerificationModel = require('../../models/VerificationId');
const RecidencyModel = require('../../models/RecidencyModel');


var authFile = require('../../auth.js');

const getKYCStatus = async (req, res) => {

    var api_key_result = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
    }

    let user_id = req.body.user_id;

    let verification = await VerificationModel.findOne(
        { user_id: user_id }
    );

    let recidency = await RecidencyModel.findOne(
        { user_id: user_id }
    );

    let verificationStatus = -1;
    let recidencyStatus = -1;

    if (verification) {
        if (verification.status == 1) {
            verificationStatus = 1;
        }
        else if (verification.status == 2) {
            verificationStatus = 2;
        } else if (verification.status == 0) {
            verificationStatus = 0;
        }
    }

    if (recidency) {
        if (recidency.status == 1) {
            recidencyStatus = 1;
        }
        else if (recidency.status == 2) {
            recidencyStatus = 2;
        }
        else if (recidency.status == 0) {
            recidencyStatus = 0;
        }
    }


    return res.json({
        status: "success",
        data: {
            verificationStatus: verificationStatus,
            recidencyStatus: recidencyStatus
        }
    });




}

module.exports = getKYCStatus;