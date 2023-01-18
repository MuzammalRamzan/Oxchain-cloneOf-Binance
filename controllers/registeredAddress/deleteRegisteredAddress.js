const User = require("../../models/User");
const RegisteredAddress = require("../../models/RegisteredAddress");
var authFile = require("../../auth.js");

const deleteRegisteredAddress = async function (req, res) {

    var api_key_result = req.body.api_key;

    let result = await authFile.apiKeyChecker(api_key_result);

    if (result === true) {
        let user = await User.findOne({
            _id: req.body.user_id
        });

        let address = null;

        if (user) {

            address = await RegisteredAddress.findOne({
                _id: req.body.address_id,
                user_id: req.body.user_id
            });
        }

        if (address) {
            let deleted = await RegisteredAddress.deleteOne({
                _id: req.body.address_id
            });
            if (deleted) {
                res.json({
                    status: "success",
                    message: "Address deleted",
                    showableMessage: "Address deleted"
                });
            }
        }
    } else {
        res.json({
            status: "fail",
            message: "invalid_api_key",
            showableMessage: "Invalid api key"
        });
        return;
    }
};

module.exports = deleteRegisteredAddress;