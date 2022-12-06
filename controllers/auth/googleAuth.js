const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../../models/User");
const authFile = require("../../auth.js");

const client = new OAuth2Client("CLIENT_ID");

const googleAuth = async (req, res) => {
  const { token, apiKey } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: "CLIENT_ID",
  });
  const data = ticket?.getPayload();
  if (!data)
    return res.json({
      status: "error",
      message: "Unable to authenticate user!",
    });

  const user = await UserModel.findOneAndUpdate({ email: data.email }, data, {
    upsert: true,
  });
  return res.json({ status: "success", data: user });
};

module.exports = googleAuth;
