const UserModel = require('../../models/User');

var authFile = require('../../auth');

const removePhone = async (req, res) => {

    let user_id = req.body.user_id;
    let api_key = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key);

    if (result == true) {

        if (user_id == null || user_id == "") {
            return res.json({ status: "error", message: "user_id is null" });
        }

        let user = await UserModel.findOne(
            {
                _id: user_id
            }
        );

        if (user == null) {
            return res.json({ status: "error", message: "user is null" });
        }

        if (user.email == null || user.email == "") {

            return res.json({ status: "error", message: "user email is null", showableMessage: "You can't remove your phone number before adding email" });
        }
        else {

            user.phone_number = null;
            user.country_code = null;
            user.save();
            return res.json({ status: "success", message: "phone number removed", showableMessage: "Phone number removed" });
        }
    }
    else {
        res.json("error");
    }

};

module.exports = removePhone;