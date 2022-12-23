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

            let array = [];

            let userObject = {};
            for (let i = 0; i < verification.length; i++) {
                let user = await UserModel
                    .findOne({
                        _id: verification[i].user_id
                    })
                    .exec();

                userObject = {
                    user_id: user._id,
                    email: user.email,
                    name: user.name ?? "",
                    surname: user.surname ?? "",
                    country_code: user.country_code ?? "",
                    phone_number: user.phone_number ?? "",
                    address: user.address ?? "",
                    city: user.city ?? "",
                    url: verification[i].url,
                    country: verification[i].country,
                    createdAt: verification[i].createdAt,
                }

                array.push(userObject);

            }

            return res.json({
                status: "success",
                message: "KYC applications found",
                showableMessage: "KYC applications found",
                data: array
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