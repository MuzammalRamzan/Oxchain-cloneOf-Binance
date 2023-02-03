const UserModel = require('../../models/User');


const deleteAccount = async (req, res) => {
    let showableUserId = req.body.showableUserId;

    let user = await UserModel.findOne({ showableUserId: showableUserId }).exec();

    if (user) {
        user.remove();
        res.json({
            status: "success",
            message: "User deleted",
            showableMessage: "User deleted",
        });
    }
};

module.exports = deleteAccount;