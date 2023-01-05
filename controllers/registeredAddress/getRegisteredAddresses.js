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
  const search = req.body.search;




  const result = await authFile.apiKeyChecker(api_key);
  if (result === true) {

    // Get all registered addresses for a user with filters if provided

    //search will be used to search for label, address, type, origin, network
    //if search is provided, it will override all other filters


    const registeredAddresses = await RegisteredAddressModel.find({
      user_id,
      ...(coin_id && { coin_id }),
      ...(whiteListed && { whiteListed }),
      ...(type && { type }),
      ...(label && { label }),
      ...(origin && { origin }),
      ...(network && { network }),
      ...(search && { $or: [{ label: { $regex: search, $options: "i" } }, { tag: { $regex: search, $options: "i" } }, { address: { $regex: search, $options: "i" } },] }),
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
