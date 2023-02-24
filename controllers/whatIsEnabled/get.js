const UserModel = require('../../models/User');
const authFile = require('../../auth.js');

const get = async (req, res) => {


    const { country_code, phone_number, email, api_key } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

    let user = "";

    let returnData = {};
    if (country_code && phone_number) {

        let findUser = await UserModel.findOne({
            country_code: country_code,
            phone_number: phone_number
        }).exec();


        if (findUser) {
            let email, phone_number, twofa = false;

            if (findUser.email) {
                email = true;
            }

            if (findUser.phone_number) {
                phone_number = true;
            }

            if (findUser.twofa) {
                twofa = true;
            }

            returnData = {
                email: email,
                phone: phone_number,
                twofa: twofa
            }

            return res.json({ status: "success", data: returnData });
        }

        return res.json({ status: "fail", message: "user_not_found" });

    }


    if (email) {

        let findUser = await UserModel.findOne({
            email: email
        }).exec();


        if (findUser) {
            let email, phone_number, twofa = false;

            if (findUser.email) {
                email = true;
            }

            if (findUser.phone_number) {
                phone_number = true;
            }

            if (findUser.twofa) {
                twofa = true;
            }

            returnData = {
                email: email,
                phone: phone_number,
                twofa: twofa
            }

            return res.json({ status: "success", data: returnData });
        }

    }



}


module.exports = get;


