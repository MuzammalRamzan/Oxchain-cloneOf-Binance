const Pairs = require("../../models/Pairs");

const getPairs = async function (req, res) {
  var list = await Pairs.find({ status: 1 }).exec();
  res.json({ status: "success", data: list });
};

module.exports = getPairs;
