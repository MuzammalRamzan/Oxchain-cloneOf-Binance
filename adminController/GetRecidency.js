const RecidencyModel = require('../models/RecidencyModel');
const UserModel = require('../models/User');

const Auth = require('../auth.js');

const getRecidency = async (req, res) => {


    const api_key = req.body.api_key;

    const result = await Auth.apiKeyChecker(api_key);

    if (result === true) {

        let recidency = await RecidencyModel.find({
            status: 0
        }).exec();

        if (recidency) {

            let array = [];

            let userObject = {};
            for (let i = 0; i < recidency.length; i++) {

                let user = await UserModel.findOne({
                    _id: recidency[i].user_id
                }).exec();

                userObject = {
                    user_id: user._id,
                    email: user.email,
                    name: user.name ?? "",
                    surname: user.surname ?? "",
                    country_code: user.country_code ?? "",
                    phone_number: user.phone_number ?? "",
                    address: user.address ?? "",
                    city: user.city ?? "",
                    url: recidency[i].url,
                    url2: recidency[i].url2,
                    url3: recidency[i].url3,
                    country: recidency[i].country,
                    createdAt: recidency[i].createdAt,
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

}


module.exports = getRecidency;