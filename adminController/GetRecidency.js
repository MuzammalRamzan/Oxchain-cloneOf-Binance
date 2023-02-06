const VerificationIdModel = require('../models/RecidencyModel');
const UserModel = require('../models/User');

const Auth = require('../auth.js');


const getRecidency = async (req, res) => {

    const api_key = req.body.api_key;

    let user_id = req.body.user_id;
    const result = await Auth.apiKeyChecker(api_key);

    if (result === true) {

        let verification = await VerificationIdModel.find({
            status: 0,
            ...(user_id && { user_id }),
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

                if (user == null || user == undefined || user == '') {
                    continue;
                }
                userObject = {
                    user_id: user._id,
                    email: user.email,
                    name: user.name ?? "",
                    surname: user.surname ?? "",
                    country_code: user.country_code ?? "",
                    phone_number: user.phone_number ?? "",
                    address: user.address ?? "",
                    city: user.city ?? "",
                    url: verification[i].url ?? "",
                    url2: verification[i].url2 ?? "",
                    country: verification[i].country,
                    createdAt: verification[i].createdAt,
                }

                array.push(userObject);

            }

            return res.json({
                status: "success",
                message: "Recidency applications found",
                showableMessage: "Recidency applications found",
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

module.exports = getRecidency;