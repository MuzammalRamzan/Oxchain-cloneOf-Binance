const fs = require("fs");
const AppleAuth = require("apple-auth");
const jwt = require("jsonwebtoken");
const UserModel = require("../../models/User");
const path = require("path");
const { getToken } = require("../../auth");
const RegisterMailModel = require("../../models/RegisterMail");
const RegisterSMSModel = require("../../models/RegisterSMS");
const SecurityKey = require("../../models/SecurityKey");
const Device = require("../../models/Device");
const UserRef = require("../../models/UserRef");
const LoginLogs = require("../../models/LoginLogs");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");
const utilities = require("../../utilities");

const authKeyPath = path.join(__dirname, "../../AuthKey.p8");

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
  const {
    authCode,
    deviceName,
    deviceType,
    manufacturer,
    ip,
    deviceModel,
    user_id,
    city,
  } = req.body;
  try {
    const response = await auth.accessToken(authCode);
    const data = jwt.decode(response.id_token);
    
    const user = await UserModel.findOne({ email: data.email }).lean();

    if (user) {
      // securityLevel
      let securityLevel = 0;
      const emailVerifyCheck = await RegisterMailModel.findOne({
        email: user.email,
        status: "1",
      });
      const smsVerifyCheck = await RegisterSMSModel.findOne({
        phone_number: user.phone_number,
        status: "1",
      });
      const securityKey = await SecurityKey.find({
        user_id: user_id,
        status: 1,
      }).lean();
      if (securityKey) securityLevel = securityLevel + 1;
      if (emailVerifyCheck && smsVerifyCheck) securityLevel = securityLevel + 1;
      if (user.twofa) securityLevel = securityLevel + 1;

      // device
      let device = new Device({
        user_id: user._id,
        deviceName: deviceName ?? "null",
        deviceType: deviceType ?? "null",
        loginTime: Date.now(),
        ip: ip ?? "null",
        city: city ?? "null",
      });
      await device.save();
      let device_id = device._id;
      req.session.device_id = device_id;

      // user ref
      const userRef = await UserRef.findOne({
        user_id: user._id,
      }).lean();

      // login logs
      const newUserLog = new LoginLogs({
        user_id: user["_id"],
        ip: ip ?? "null",
        deviceName: deviceName ?? "null",
        manufacturer: manufacturer ?? "null",
        model: deviceModel ?? "null",
        status: "completed",
      });
      await newUserLog.save();

      // response
      const data = {
        response: "success",
        email: user.email,
        twofa: user.twofa,
        emailVerify: !!emailVerifyCheck,
        smsVerify: !!smsVerifyCheck,
        device_id: device_id,
        status: user.status,
        user_id: user._id,
        ref_id: userRef.refCode,
        securityLevel,
        device_token: device_id,
        token: getToken({ user: user_id }),
        name: user.name,
      };

      // settings
      const withdrawalWhiteList = await WithdrawalWhiteListModel.findOne({
        user_id: user._id,
      }).lean();
      data.withdrawalWhiteList = !!withdrawalWhiteList?.status;
      const oneStepWithdraw = await OneStepWithdrawModel.findOne({
        user_id: user._id,
      }).lean();
      data.oneStepWithdraw = !!oneStepWithdraw?.status;

      return res.json({ status: "success", data });
      
    } else {
      const newUser = UserModel({
        email: data.email,
      });
      await newUser.save();

      const refCode = utilities.makeId(10);
      const newRef = new UserRef({
        user_id: newUser._id,
        refCode: refCode,
      });
      await newRef.save();

      await RegisterMailModel.updateOne(
        { email: data.email },
        {
          email: data.email,
          status: "1",
        },
        { upsert: true }
      );
      return res.json({ status: "success", data: newUser });
    }
  } catch (err) {
    return res.status(401).json({ status: "error", message: err });
  }
};

module.exports = appleAuth;
