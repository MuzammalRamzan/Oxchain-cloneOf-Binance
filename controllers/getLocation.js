const geoip = require("geoip-lite");
const authFile = require("../auth");

const getLocation = async (req, res) => {
  const { method, apiKey, userId, data } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

    console.log(req.ip)

  const geo = geoip.lookup('182.188.156.192');

  return res.json({ status: "success", data: geo });
};

module.exports = getLocation;
