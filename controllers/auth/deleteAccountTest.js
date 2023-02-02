const UserModel = require('../../models/User');


const deleteAccount = async (req, res) => {
    let user_id = req.body.user_id;

    let user = await UserModel.findOne({ _id: user_id }).exec();

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