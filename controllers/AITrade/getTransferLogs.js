const UserModel = require("../../models/User");
const AITransferLogsModel = require("../../models/AITransferLogs");
const authFile = require("../../auth");

const getTransferLogs = async (req, res) => {

    const { user_id, api_key } = req.body;

    if (!user_id || !api_key) {
        return res.json({
            status: "fail",
            message: "Please provide user_id and api_key"
        });
    }

    var result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        if (user_id.length !== 24) {
            return res.json({
                status: "fail",
                message: "Invalid user_id"
            });
        }

        let UserCheck = await UserModel.findOne({ _id: user_id });

        if (!UserCheck) {
            return res.json({
                status: "fail",
                message: "User not found"
            });
        }


        let transfers = await AITransferLogsModel.find({ user_id: user_id }).sort({ createdAt: -1 });

        if (!transfers) {
            return res.json({
                status: "fail",
                message: "No transfers found"
            });
        }

        return res.json({
            status: "success",
            data: transfers
        });



    }

}

module.exports = getTransferLogs;