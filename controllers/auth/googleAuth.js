const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../../models/User");
const authFile = require("../../auth.js");
const { getToken } = require("../../auth");

const CLIENT_ID = "478064601125-05qphf7f1ho60j32vf50dt3f3esqsar3.apps.googleusercontent.com"
const client = new OAuth2Client(CLIENT_ID);

const googleAuth = async (req, res) => {
  const { token, apiKey } = req.body;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
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
  const authToken = getToken({ user: user._id });
  return res.json({ status: "success", data: { user, token: authToken } });
};

module.exports = googleAuth;
