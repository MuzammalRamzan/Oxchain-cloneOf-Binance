const UserModel = require('../models/User');
const VerificationIdModel = require('../models/VerificationId');
const RecidencyModel = require('../models/RecidencyModel');

const Auth = require('../auth.js');


const getKYCandRecidency = async (req, res) => {


    const { api_key, user_id } = req.body;


    //user id regex
    const user_id_regex = /^[0-9a-fA-F]{24}$/;

    if (!user_id_regex.test(user_id)) {
        return res.json({
            status: "error",
            message: "Invalid user id",
            showableMessage: "Invalid user id",
        });
    }


    const result = await Auth.apiKeyChecker(api_key);

    if (result === true) {


        let user = await UserModel.findOne({
            _id: user_id
        }).exec();

        if (user == null || user == undefined || user == '') {
            return res.json({
                status: "error",
                message: "User not found",
                showableMessage: "User not found",
            });
        }

        let verification = await VerificationIdModel.findOne({
            user_id: user_id
        }).exec();

        let recidency = await RecidencyModel.findOne({
            user_id: user_id
        }).exec();

        return res.json({
            status: "success",
            message: "User found",
            verification: verification,
            recidency: recidency,
        });

    }


}

module.exports = getKYCandRecidency;