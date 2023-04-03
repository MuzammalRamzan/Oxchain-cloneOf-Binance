const RegisteredAddressModel = require("../../models/RegisteredAddress");
const authFile = require("../../auth.js");

const getRegisteredAddresses = async (req, res) => {
  const api_key = req.body.api_key;
  const user_id = req.body.user_id;
  const coin_id = req.body.coin_id;
  const whiteListed = req.body.whiteListed;
  const type = req.body.type;
  const label = req.body.label;
  const origin = req.body.origin;
  const network = req.body.network;
  const address = req.body.address;


  const result = await authFile.apiKeyChecker(api_key);
  if (result === true) {

    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }

    // Get all registered addresses for a user with filters if provided
    const registeredAddresses = await RegisteredAddressModel.find({
      user_id,
      ...(coin_id && { coin_id }),
      ...(whiteListed && { whiteListed }),
      ...(type && { type }),
      ...(label && { label }),
      ...(origin && { origin }),
      ...(network && { network }),
      ...(address && { address })
    }).exec();

    res.json({
      status: "success",
      data: registeredAddresses,
    });
  } else {
    res.json({
      status: "error",
      message: "Invalid API Key",
    });
  }
};

module.exports = getRegisteredAddresses;
