const VerificationIdModel = require('../models/VerificationId');
const UserModel = require('../models/User');

const Auth = require('../auth.js');


const getKyc = async (req, res) => {

    const api_key = req.body.api_key;

    const result = await Auth.apiKeyChecker(api_key);

    if (result === true) {

        let verification = await VerificationIdModel.find({
            status: 0
        }).exec();

        if (verification) {

            for (let i = 0; i < verification.length; i++) {
                let user = await UserModel
                    .findOne({
                        _id: verification[i].user_id
                    })
                    .exec();

                verification[i].user = user;

            }

            return res.json({
                status: "success",
                message: "KYC applications found",
                showableMessage: "KYC applications found",
                data: verification
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

};

module.exports = getKyc;