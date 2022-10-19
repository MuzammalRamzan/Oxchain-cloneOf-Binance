const Pairs = require("../../models/Pairs");
var authFile = require("../../auth.js");

const addPair = async function (req, res) {
  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newPair = new Pairs({
      name: req.body.name,
      symbolOne: req.body.symbolOne,
      symbolTwo: req.body.symbolTwo,
      digits: req.body.digits,
      type: req.body.type,
      symbolOneID: req.body.symbolOneID,
      symbolTwoID: req.body.symbolTwoID,
    });

    newPair.save();
    res.json({ status: "success", data: "" });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = addPair;
