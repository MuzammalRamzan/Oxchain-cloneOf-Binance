const AcademyModal = require("../../models/Academy");
const Admin = require("../../models/Admin");
const authFile = require('../../auth');

const getTopics = async (req, res) => {

    const { user_id, api_key } = req.body;

    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
        return res.status(403).json({
            status: 'Failed',
            message: '403 Forbidden',
            showableMessage: 'Forbidden 403, Please provide valid api key'
        });
    }

    var admin = await Admin.findOne({
        _id: user_id,
        status: 1

    });

    if (admin == null) {
        return res.json({
            status: "error",
            message: "Authorization Failed",
            showableMessage: "You are not authorized"
        });
    }

    const topics = await AcademyModal.find({ status: 1 }).sort({ createdAt: -1 });

    if (topics) {
        return res.status(200).json({
            status: "Success",
            message: "Topics found",
            showableMessage: "Topics found",
            topics: topics
        })
    }

    return res.status(200).json({
        status: "Success",
        message: "No Topics found",
        showableMessage: "No Topics found",
        topics: []
    })


}

module.exports = getTopics;