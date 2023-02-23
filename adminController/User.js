
var authFile = require('../auth.js');
var UserModel = require('../models/User');
const BlockedUserModel = require('../models/blockedUser.js');
const { depositFundOfuser } = require('./depositFund.js');
const { withdrawFundOfuser } = require('./withdrawFund.js');

const mailer = require('../mailer');
const BanUser = async (req, res) => {
    try {
        //burada banlanacak kullanıcı id'si alınacak

        const { apiKey, userId, reason } = req.body;

        if (apiKey == null || userId == null) {
            return res.json({
                status: 'error',
                message: 'Api key or user id is null',
            });
        }
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }
        let user = await UserModel.findOne({ _id: userId });
        if (user == null) {
            return res.status(404).json({
                status: 'fail',
                message: 'Not found',
                showableMessage: 'User not found',
            });
        }
        const blockeduser = new BlockedUserModel({
            user_id: userId,
            reason: reason,
        });
        await blockeduser.save();
        user.status = '5';
        await user.save();

        if (user.email) {
            mailer.sendMail(
                user.email,
                'Your account has been banned',
                'Your account has been banned.');
        }

        res.status(200).json({
            status: 'success',
            message: 'User banned',
            showableMessage: 'User banned',
        });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};
const getAllBannedUser = async (req, res) => {
    try {
        var apiKey = req.body.apiKey;

        if (apiKey == null) {
            return res.json({
                status: 'error',
                message: 'Api key is null',
            });
        }

        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }
        var blockedUsers = await BlockedUserModel.find()
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'name surname status',
            })
            .lean();
        if (!blockedUsers.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Not found',
                showableMessage: 'No Blocked User found',
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Blocked USers',
            data: blockedUsers,
        });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};
const ReBanUser = async (req, res) => {
    try {
        var apiKey = req.body.apiKey;
        var userId = req.body.userId;

        if (apiKey == null || userId == null) {
            return res.json({
                status: 'error',
                message: 'Api key or user id is null',
            });
        }
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }

        var user = await UserModel.findOne({ _id: userId, status: '5' });

        if (user == null) {
            return res.status(404).json({
                status: 'fail',
                message: 'Not found',
                showableMessage: 'User not found',
            });
        }
        await BlockedUserModel.deleteOne({ user_id: userId });
        user.status = '1';

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'User re-banned',
            showableMessage: 'User re-banned',
        });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};

const editUser = async (req, res) => {
    try {
        const apiKey = req.body.apiKey;
        const userId = req.body.userId;
        const twoFAPin = req.body.twoFAPin;
        const name = req.body.name;
        const surname = req.body.surname;
        const email = req.body.email;
        const countryCode = req.body.countryCode;
        const phoneNumber = req.body.phoneNumber;
        const city = req.body.city;
        const country = req.body.country;
        const address = req.body.address;

        if (!apiKey)
            return res.json({ status: 'error', message: 'Api key is null' });
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }

        const data = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (twoFAPin) data.twofa = twoFAPin;
        if (surname) data.surname = surname;
        if (countryCode) data.country_code = countryCode;
        if (phoneNumber) data.phone_number = phoneNumber;
        if (city) data.city = city;
        if (country) data.country = country;
        if (address) data.address = address;

        await UserModel.updateOne({ _id: userId }, data);
        return res.json({ status: 'success', message: 'User updated' });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};

const getUser = async (req, res) => {
    try {
        const apiKey = req.body.apiKey;
        const userId = req.body.userId;

        if (!apiKey)
            return res.json({ status: 'error', message: 'Api key is null' });
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }

        const user = await UserModel.findOne({ _id: userId }).lean();
        if (!user) return res.json({ status: 'error', message: 'user not found' });
        return res.json({ status: 'success', data: user });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};

const userList = async (req, res) => {
    try {
        const apiKey = req.body.apiKey;

        if (!apiKey)
            return res.json({ status: 'error', message: 'Api key is null' });
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }

        const users = await UserModel.find().lean();
        return res.json({ status: 'success', data: users });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};

const denyApplicant = async (req, res) => {
    try {
        const apiKey = req.body.apiKey;
        const userId = req.body.userId;

        if (!apiKey)
            return res.json({ status: 'error', message: 'Api key is null' });
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }

        const user = await UserModel.findById(userId).lean();
        await resetApplicant(user.applicantId);
        await UserModel.updateOne({ _id: userId }, { applicantStatus: 0 });

        return res.json({ status: 'success', message: 'Applicant updated' });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};
const filterUser = async (req, res) => {
    try {
        const apiKey = req.body.apiKey;
        if (!apiKey)
            return res.json({ status: 'error', message: 'Api key is null' });
        const isAuthenticated = await authFile.apiKeyChecker(apiKey);
        if (!isAuthenticated) {
            return res.status(403).json({
                status: 'fail',
                message: '403 Forbidden',
                showableMessage: 'Forbidden 403, Please provide valid api key',
            });
        }
        const { id, name, email } = req.body;
        const recordPerPage = req.body.recordPerPage || 10;
        const dateFrom = req.body.dateFrom;
        const dateTo = req.body.dateTo;

        // Build the filter object
        const filter = {};
        let updatedUsers = [];

        if (id) filter._id = id;
        if (name) filter.name = name;
        if (email) filter.email = email;
        if (dateFrom) filter.createdAt = { $gte: dateFrom };
        if (dateTo) filter.createdAt = { ...filter.createdAt, $lte: dateTo };

        // Execute the query
        let users = await UserModel.find(filter).limit(recordPerPage).exec();
        for (i = 0; i < users.length; i++) {
            let totalUSDDeposited = 0;
            let totalUsdWithdrawn = 0;
            const data = await depositFundOfuser(users[i]._id.toString());
            for (let i = 0; i < data.length; i++) {
                if (data[i].symbol === 'Margin') continue;
                if (data[i].symbol === 'USDT') {
                    totalUSDDeposited += parseFloat(data[i].availableBalance);
                } else {
                    totalUSDDeposited += parseFloat(data[i].usdtValue);
                }
            }
            const data1 = await withdrawFundOfuser(users[i]._id.toString());
            for (let i = 0; i < data1.length; i++) {
                if (data1[i].symbol === 'Margin') continue;
                if (data1[i].symbol === 'USDT') {
                    totalUsdWithdrawn += parseFloat(data1[i].availableBalance);
                } else {
                    totalUsdWithdrawn += parseFloat(data1[i].usdtValue);
                }
            }
            const user = { ...users[i]._doc };
            user.totalUSDDeposited = totalUSDDeposited;
            user.totalUsdWithdrawn = totalUsdWithdrawn;
            updatedUsers.push(user);
        }
        return res.json({
            status: 'success',
            message: 'Users',
            data: updatedUsers,
        });
    } catch (error) {
        return res.status(501).json({
            status: 'error',
            message: 'Internal Server Error',
            showableMessage: error.message,
        });
    }
};
module.exports = {
    BanUser,
    ReBanUser,
    editUser,
    getUser,
    userList,
    denyApplicant,
    filterUser,
    getAllBannedUser,
};

