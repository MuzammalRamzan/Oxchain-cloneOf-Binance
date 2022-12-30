const VerificationModel = require('../../models/VerificationId');
const RecidencyModel = require('../../models/RecidencyModel');

const User = require('../../models/User');



const clearKYCAndRecidency = async function (req, res) {

    let user_id = req.body.user_id;

    // delete kyc   

    let verification = await VerificationModel.findOne
        ({
            user_id: user_id,
        }).exec();

    if (verification != null) {
        verification.remove();
    }

    // delete recidency

    let recidency = await RecidencyModel.findOne
        ({
            user_id: user_id,
        }).exec();

    if (recidency != null) {
        //delete recidency
        recidency.remove();

    }

    res.json({
        status: "success",
        message: "success",
        showableMessage: "KYC and Recidency Cleared"
    });

};

module.exports = clearKYCAndRecidency;