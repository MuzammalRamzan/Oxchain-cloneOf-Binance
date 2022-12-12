const geoip = require("geoip-lite");
const authFile = require("../../auth");

const getLocation = async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const geo = geoip.lookup(req.ip);
  return res.json({ status: "success", data: geo });
};

module.exports = getLocation;
