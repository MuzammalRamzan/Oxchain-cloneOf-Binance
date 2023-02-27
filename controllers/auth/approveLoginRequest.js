const DeviceModel = require("../../models/Device");
const authFile = require("../../auth.js");

const approveRequest = async (req, res) => {

    const { deviceId, api_key } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let Device = await DeviceModel.findOne({
            _id: deviceId,
        }).exec();

        if (Device) {

            Device.loginRequest = 2;
            await Device.save();

            return res.json({ status: "success", message: "Login request approved" });

        }
        else {
            return res.json({ status: "fail", message: "Device not found", showableMessage: "Device not found" });
        }

    }


}

module.exports = approveRequest;