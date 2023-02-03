const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth.js');
const UserModel = require('../../models/User');
const { UserListFollowedV2Paginator } = require('twitter-api-v2');

const getFees = async (req, res) => {

    const api_key = req.body.api_key;
    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        //list referral fees group by to_user_id and sum amount list by amount desc for last 7 days
        const fees = await FeeModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: "$to_user_id",
                    amount: { $sum: "$amount" },
                    to_user_id: { $first: "$to_user_id" }
                }
            },
            {
                $sort: {
                    amount: -1
                }
            }
        ]);



        let returnData = [];
        console.log(fees);
        for (let i = 0; i < fees.length; i++) {


            const user = await UserModel.findOne({
                _id: fees[i].to_user_id,
            }).exec();

            if (user == null || user == undefined || user == '') {
            }
            else {
                fees[i].showableUserId = user.showableUserId;
                let data = {
                    showableUserId: user.showableUserId,
                    amount: fees[i].amount
                }
                returnData.push(data);
            }
        }

        return res.json({
            status: 'success',
            data: returnData,
        });




    } else {
        res.json({
            status: 'error',
            message: 'Invalid API Key',
        });
    }

};

module.exports = getFees;