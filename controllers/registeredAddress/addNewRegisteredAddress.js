const User = require("../../models/User");
const RegisteredAddress = require("../../models/RegisteredAddress");
var authFile = require("../../auth.js");

const addNewRegisteredAddress = async function (req, res) {

  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({ _id: req.body.user_id });

    if (user) {


      let checkAddress = await RegisteredAddress.findOne({
        user_id: req.body.user_id,
        address: req.body.address
      });

      if (checkAddress) {
        res.json({ status: "fail", message: "Address already exists", showableMessage: "Address already exists" });
        return;
      }
      
      let newAddress = new RegisteredAddress({
        user_id: req.body.user_id,
        address: req.body.address,
        coin_id: req.body.coin_id,
        tag: req.body.tag,
        whiteListed: req.body.whiteListed,
        type: req.body.type,
        label: req.body.label,
        origin: req.body.origin,
        network: req.body.network
      });

      let saved = await newAddress.save();
      if (saved) {
        res.json({ status: "success", message: saved });
      }
    } else {
      res.json({ status: "fail", message: "Invalid user", showableMessage: "Invalid user" });
    }
  } else {
    res.json({ status: "fail", message: "invalid_api_key", showableMessage: "Invalid api key" });
    return;
  }
};

module.exports = addNewRegisteredAddress;
