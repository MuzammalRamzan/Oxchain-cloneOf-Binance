const fs = require("fs");
const AppleAuth = require("apple-auth");
const jwt = require("jsonwebtoken");
const UserModel = require("../../models/User");
const path = require('path');
const { getToken } = require("../../auth");

const authKeyPath = path.join(__dirname, '../../AuthKey.p8');

const config = {
  client_id: "com.sample.oxhain.client",
  team_id: "XMT9U2G4PY",
  key_id: "H825328LHY",
  redirect_uri: "https://oxhain.com/callbacks/sign_in_with_apple",
  scope: "name email",
};

const auth = new AppleAuth(
  config,
  fs.readFileSync(authKeyPath).toString(),
  "text"
);

const appleAuth = async (req, res) => {
  try {
    const response = await auth.accessToken(req.body.authCode);
    const data = jwt.decode(response.id_token);
    const user = await UserModel.findOneAndUpdate({ email: data.email }, data, {
        upsert: true,
      });
      const authToken = getToken({ user: user._id });
      return res.json({ status: "success", data: { user, token: authToken } });
  } catch (err) {
    return res.status(401).json({ status: "error", message: err });
  }
};

module.exports = appleAuth;
