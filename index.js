'use strict';
var authFile = require('./auth.js');
var mailer = require('./mailer.js');
var CopyTrade = require('./CopyTrade.js');
const Connection = require('./Connection');
var bodyParser = require('body-parser');
const multer = require('multer');
const express = require('express');
var cors = require('cors');

//express-fileupload

require('dotenv').config();

// controllers
const fs = require('fs');
const https = require('https');
const login = require('./controllers/auth/login');
const transfer = require('./controllers/wallet/transfer');
const sendMailPin = require('./controllers/sendMailPin');
const sendSMSPin = require('./controllers/sendSMSPin');
const register = require('./controllers/auth/register');
const addCoin = require('./controllers/coin/addCoin');
const copyLeaderRequest = require('./controllers/copyLeaderRequest');
const getClosedMarginOrders = require('./controllers/orders/getClosedMarginOrders');
const getOpenMarginOrders = require('./controllers/orders/getOpenMarginOrders');
const closeMarginOrder = require('./controllers/orders/closeMarginOrder');
const addMarginOrder = require('./controllers/orders/addMarginOrder');
const withdraw = require('./controllers/withdraw/withdraw');
const deleteLimit = require('./controllers/orders/deleteLimit');
const deleteMarginLimit = require('./controllers/orders/deleteMarginLimit');
const addOrders = require('./controllers/orders/addOrders');
const disableAccount = require('./controllers/accountActivities/disableAccount');
const enableAccount = require('./controllers/accountActivities/enableAccount');
const deleteAccount = require('./controllers/users/deleteAccount');
const addNewRegisteredAddress = require('./controllers/registeredAddress/addNewRegisteredAddress');
const deleteRegisteredAddress = require('./controllers/registeredAddress/deleteRegisteredAddress');
const addNotification = require('./controllers/addNotification');
const getNotification = require('./controllers/getNotification');
const getOrders = require('./controllers/orders/getOrders');
const getUSDTBalance = require('./controllers/wallet/getUSDTBalance');
const getPairs = require('./controllers/pair/getPairs');
const addPair = require('./controllers/pair/addPair');
const getDigits = require('./controllers/pair/getDigits');
const getCoinList = require('./controllers/coin/getCoinList');
const getCoinInfo = require('./controllers/coin/getCoinInfo');
const getWallet = require('./controllers/wallet/getWallet');
const twoFactor = require('./controllers/auth/twoFactor');
const update2fa = require('./controllers/auth/update2fa');
const cancelAllLimit = require('./controllers/orders/cancelAllLimit');
const cancelAllStopLimit = require('./controllers/orders/cancelAllStopLimit');
const cancelOrder = require('./controllers/orders/cancelOrder');
const addSecurityKey = require('./controllers/securityKey/addSecurityKey');
const updateSecurityKey = require('./controllers/securityKey/updateSecurityKey');
const lastActivities = require('./controllers/lastActivities');
const activities = require('./controllers/accountActivities/activities');
const updatePhone = require('./controllers/users/updatePhone');
const resetPassword = require('./controllers/users/resetPassword');
const changeEmail = require('./controllers/users/changeEmail');
const changePassword = require('./controllers/users/changePassword');
const getUserId = require('./controllers/users/getUserId');
const getUserInfo = require('./controllers/users/getUserInfo');
const updateUserInfo = require('./controllers/users/updateUserInfo');
const getLastLogin = require('./controllers/getLastLogin');
const checkSecurityKey = require('./controllers/securityKey/checkSecurityKey');
const getSecurityKey = require('./controllers/securityKey/getSecurityKey');
const deleteSecurityKey = require('./controllers/securityKey/deleteSecurityKey');
const changeAvatar = require('./controllers/users/changeAvatar');
const changeNickname = require('./controllers/users/changeNickname');
const addWithdraw = require('./controllers/withdraw/addWithdraw');
const get2fa = require('./controllers/auth/get2fa');
const sendSMS = require('./controllers/sendSMS');
const sendMail = require('./controllers/sendMail');
const changePhone = require('./controllers/users/changePhone');
const getDepositsUSDT = require('./controllers/coin/getDepositsUSDT');
const depositCoinList = require('./controllers/deposit/getCoinList');
const depositCoinNetworkOptions = require('./controllers/deposit/getCoinNetworkOption');
const addCoinNetworkOption = require('./controllers/deposit/addCoinNetworkOption');
const addNetwork = require('./controllers/deposit/addNetwork');
const depositNetworkList = require('./controllers/deposit/getNetworkList');
const depositWalletAddress = require('./controllers/deposit/getWalletAddress');
const getMarginOrders = require('./controllers/orders/getMarginOrders');
const getActiveDevice = require('./controllers/deviceManagement/getActiveDevice');
const deleteActiveDevice = require('./controllers/deviceManagement/deleteActiveDevice');
const getVerificationMethod = require('./controllers/auth/getVerificationMethod');
const createApplicant = require('./controllers/kyc/createApplicant');
const addDocument = require('./controllers/kyc/addDocument');
const getApplicantStatus = require('./controllers/kyc/getApplicantStatus');
const walletToWallet = require('./controllers/transfer/index');
const getRegisteredAddresses = require('./controllers/registeredAddress/getRegisteredAddresses');
const googleAuth = require('./controllers/auth/googleAuth');
const appleAuth = require('./controllers/auth/appleAuth');
const searchPosts = require('./controllers/posts/searchPost.js');
const securityActivities = require('./controllers/accountActivities/securityActivities');
const getWalletsBalance = require('./controllers/GetUserBalances/getWalletsbalances.js');
const removePhone = require('./controllers/users/removePhone');
const removeEmail = require('./controllers/users/removeEmail');
const walletTowalletBetweenUsers = require('./controllers/WalletToWallet/transfer');

const addAvatar = require('./controllers/avatar/addAvatar');
const getAvatar = require('./controllers/avatar/getAvatarList');

const addAnnouncement = require('./controllers/announcement/addAnnouncement');
const getAnnouncement = require('./controllers/announcement/getAnnouncement');
const getLocation = require('./controllers/users/getLocation');

const getSiteNotificationSettings = require('./controllers/siteNotifications/get');
const updateSiteNotificationSettings = require('./controllers/siteNotifications/update');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oidc');
//var formattedKey = authenticator.generateKey();
//var formattedToken = authenticator.generateToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse");
//console.log(authenticator.verifyToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse", "260180"));
//console.log(formattedToken);

Connection.connection();
var route = express();
const delay = (duration) => {
	return new Promise((resolve) => setTimeout(resolve, duration));
};
route.use(cors());
var port = process.env.PORT;

//set limit for request body for base64 image upload
route.use(bodyParser.json({ limit: '50mb' }));
route.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const topReferrals = require('./controllers/referrals/topReferrals.js');
const getReferral = require('./controllers/referrals/getReferral.js');
const addBonus = require('./controllers/bonus/addBonus.js');
const addBonusType = require('./controllers/bonusTypes/addBonusType.js');
const getBonusHistory = require('./controllers/bonus/getBonusHistory.js');
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));
const session = require('express-session');
const addMarginCrossOrder = require('./controllers/orders/addMarginCrossOrder.js');
const addMarginIsolatedOrder = require('./controllers/orders/addMarginIsolatedOrder.js');
const addFutureOrder = require('./controllers/orders/addFutureOrder.js');
const cancelFutureLimit = require('./controllers/orders/cancelFutureLimit.js');
const closeFutureOrder = require('./controllers/orders/closeFutureOrder.js');
const AdjustMargin = require('./controllers/orders/adjust_margin.js');
const editOneStepWithdraw = require('./controllers/withdraw/editOneStepWithdraw');
const getOneStepWithdraw = require('./controllers/withdraw/getOneStepWithdraw');
const editWithdrawalWhiteList = require('./controllers/withdraw/editWithdrawalWhiteList');
const getWithdrawalWhiteList = require('./controllers/withdraw/getWithdrawalWhiteList');
const UpdateStop = require('./controllers/orders/updateStop.js');
const FuturePercentClose = require('./controllers/orders/futurePercentClose.js');
const FutureAmountClose = require('./controllers/orders/futureAmountClose.js');
const Settings = require('./controllers/settings');
const SetFavoritePair = require('./controllers/pair/setFavoritePair.js');
const GetFavoritePairs = require('./controllers/pair/getFavoritePairs.js');
const myReferrals = require('./controllers/referrals/myReferrals');
const getAdminSettings = require('./controllers/getAdminSettings');
const referralRewards = require('./controllers/referrals/referralRewards');
const readNotifications = require('./controllers/readNotifications');
const clearNotifications = require('./controllers/clearNotifications');
const addVerificationId = require('./controllers/verificationId/addVerificationId');
const getVerificationIds = require('./controllers/verificationId/getVerificationIds');
const topReferralEarners = require('./controllers/referrals/topReferralEarners');
const myReferralEarns = require('./controllers/referrals/myReferralEarns');
const getAllLevelReferrals = require('./controllers/referrals/getAllLevelRefferals.js');

const getKYCStatus = require('./controllers/kyc/getStatus');
const getApiKeys = require('./controllers/api/getApiKeys');

const getDashboard = require('./controllers/dashboard/getDashboard');

const newPrediction = require('./controllers/Prediction/addPrediction');
const getPrediction = require('./controllers/Prediction/getPrediction');
const addNewApiKey = require('./controllers/api/addNewApiKey');
const editApiKey = require('./controllers/api/editApiKey');
const deleteAllKeys = require('./controllers/api/deleteAllKeys');

const Delete2fa = require('./controllers/auth/delete2fa');
const getAllFaqs = require('./controllers/FAQ/getFAQs.js');

const DeleteAccountTest = require('./controllers/auth/deleteAccountTest');

//only for testing purposes for emircan

const clearKYCAndRecidency = require('./controllers/kyc/clearKYCAndRecidency.js');

const UploadKYC = require('./controllers/kyc/UploadKYC');
const UploadRecidency = require('./controllers/kyc/uploadRecidency');

const marketingMailStatus = require('./controllers/marketingMails/mailStatus');
const changeMarketingMailStatus = require('./controllers/marketingMails/changeStatus');

const Subscription = require('./models/Subscription.js');
const { addAdmin } = require('./adminController/Admin.js');
const Login = require('./adminController/Login.js');
const CampusRequestJoin = require('./controllers/campusAmbassador/request_join.js');
const UpdateSocialMedia = require('./controllers/users/updateSocialMedia.js');
const checkTwitterAccount = require('./Functions/checkTwitterAccount.js');
const { default: axios } = require('axios');
const GetDepositHistory = require('./controllers/deposit/getDepositHistory.js');
const GetWithdrawHistory = require('./controllers/withdraw/getWithdrawHistory.js');
const addSupportTicket = require('./controllers/dashboard/addSupportTicket.js');
const getSupportTicket = require('./controllers/dashboard/getSupportTicket.js');
const deleteSupportTicket = require('./controllers/dashboard/deleteSupportTicket.js');
const updateSupportTicket = require('./controllers/dashboard/updateSupportTicket.js');
const addSystemFeedback = require('./controllers/dashboard/systemFeedback.js');
const SpotLimitMarketOrders = require('./controllers/orders/history/spotLimitMarketOrders.js');
const SpotTradeHistory = require('./controllers/orders/history/spotTradeHistory.js');
const GetUserLevel = require('./controllers/users/getUserLevel.js');

const getUserNotification = require('./controllers/users/getUserNotification');
const readUserNotification = require('./controllers/users/readUserNotification');
const SpotCurrentOrders = require('./controllers/orders/history/spotCurrentOrders.js');
const SpotOrderHistory = require('./controllers/orders/history/spotOrderHistory.js');



route.use(
	session({
		secret: 'oxhain_login_session',
		resave: false,
		saveUninitialized: true,
	})
);

// route.use(
//   jwt({
//     secret: "secret",
//     algorithms: ["HS256"],
//   }).unless({
//     path: [
//       "/",
//       "/login",
//       "sendMailPin",
//       "sendSMSPin",
//       "register",
//       "getReferral",
//     ],
//   })
// );

route.use(function (err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
		res.status(401).send('Error: invalid token');
	} else {
		next(err);
	}
});

route.get('/', (req, res) => {
	res.send('success');
});

route.all('/delete2fa', Delete2fa);

route.all('/addAnnouncement', addAnnouncement);
route.all('/getAnnouncements', getAnnouncement);
route.all('/getLocation', getLocation);

route.all('/getDashboard', getDashboard);

route.all('/getUserNotifications', getUserNotification);
route.all('/readUserNotification', readUserNotification);

route.all('/getVerificationIds', upload.any(), getVerificationIds);
route.all('/addVerificationId', upload.any(), addVerificationId);

route.all('/addAvatar', addAvatar);
route.all('/getAvatar', getAvatar);

route.all('/deleteAccountForTest', DeleteAccountTest);

route.all('/securityActivities', securityActivities);
route.all('/walletToWallet', walletToWallet);

route.all('/getSiteNotificationSettings', getSiteNotificationSettings);
route.all('/updateSiteNotificationSettings', updateSiteNotificationSettings);

route.all('/getKYCStatus', getKYCStatus);

route.all('/addNewApiKey', addNewApiKey);
route.all('/deleteAllKeys', deleteAllKeys);
route.all('/getApiKeys', getApiKeys);

route.all('/newPrediction', newPrediction);
route.all('/getPrediction', getPrediction);

route.all('/editApiKey', editApiKey);

route.all('/walletToWalletBetweenUsers', walletTowalletBetweenUsers);

route.post('/subscription', async (req, res) => {
	try {
		if (
			req.body.email == null ||
			req.body.email == 'undefined' ||
			req.body.email == ''
		) {
			res.json({ status: 'fail', code: 1 });
			return;
		}

		let item = new Subscription();
		item.email = req.body.email;
		await item.save();
		res.json({ status: 'success' });
	} catch (err) {
		res.json({ status: 'fail', code: 2 });
	}
});

//DEPOSIT

//BONUS & CREDIT

//TESTING
route.all('/clearKYCAndRecidency', upload.any(), clearKYCAndRecidency);

route.post('/addBonusType', addBonusType);
route.post('/addBonus', addBonus);
route.post('/getBonusHistory', getBonusHistory);

route.all('/UploadKYC', upload.any(), UploadKYC);
route.all('/idverification', upload.any(), UploadKYC);
route.all('/UploadRecidency', upload.any(), UploadRecidency);

//AUTH
route.all('/login', upload.none(), login);
route.all('/sendMailPin', sendMailPin);
route.all('/sendSMSPin', sendSMSPin);
route.all('/register', upload.none(), register);
route.all('/disableAccount', upload.none(), disableAccount);
route.all('/enableAccount', upload.none(), enableAccount);
route.all('/deleteAccount', upload.none(), deleteAccount);
route.all('/2fa', upload.none(), twoFactor);
route.all('/update2fa', upload.none(), update2fa);
route.all('/getActiveDevice', upload.none(), getActiveDevice);
route.all('/deleteActiveDevice', upload.none(), deleteActiveDevice);
route.all('/getVerificationMethod', upload.none(), getVerificationMethod);

//ORDER HISTORY
route.all('/spotLimitMarketOrders', SpotLimitMarketOrders);
route.all('/spotTradeHistory', SpotTradeHistory);
route.all('/spotCurrentOrders', SpotCurrentOrders);
route.all('/spotOrderHistory', SpotOrderHistory);

route.all('/removePhone', upload.none(), removePhone);
route.all('/removeEmail', upload.none(), removeEmail);
route.post('/googleAuth', googleAuth);
route.post('/appleAuth', appleAuth);
// route.post('/login/federated/google', passport.authenticate('google'));
//Wallet Modules
route.post('/transfer', transfer);
route.post('/withdraw', withdraw);

route.post('/depositCoinList', depositCoinList);
route.post('/depositCoinNetworkOptions', depositCoinNetworkOptions);
route.post('/depositWalletAddress', depositWalletAddress);

route.all('/addCoinNetworkOption', addCoinNetworkOption);
route.all('/addNetwork', addNetwork);
route.all('/depositNetworkList', depositNetworkList);
route.all('/addCoin', upload.none(), addCoin);

route.all('/CopyLeaderRequest', upload.none(), copyLeaderRequest);
route.all('/getUSDTBalance', upload.none(), getUSDTBalance);
//balance Modules

route.all('/getbalance', upload.none(), getWalletsBalance);
//news Modules
route.all('/searchPosts', searchPosts);
//Trade Modules
route.all('/getOrders', upload.none(), getOrders);
route.post('/getClosedMarginOrders', getClosedMarginOrders);
route.post('/getOpenMarginOrders', getOpenMarginOrders);
route.post('/closeMarginOrder', closeMarginOrder);
route.post('/addMarginOrder', addMarginOrder);
route.post('/addMarginCrossOrder', addMarginCrossOrder);
route.post('/addMarginIsolatedOrder', addMarginIsolatedOrder);
route.post('/adjustMargin', AdjustMargin);
route.post('/updateStop', UpdateStop);
route.post('/futurePercentClose', FuturePercentClose);
route.post('/futureAmountClose', FutureAmountClose);

route.post('/addFutureOrder', addFutureOrder);
route.post('/cancelFutureLimit', cancelFutureLimit);
route.post('/closeFutureOrder', closeFutureOrder);

route.get('/getMarginOrders', getMarginOrders);
route.post('/spotHistory', async (req, res) => {
	var api_key_result = req.body.api_key;

	let api_result = await authFile.apiKeyChecker(api_key_result);
	if (api_result === false) {
		res.json({ status: 'fail', message: 'Forbidden 403' });
		return;
	}
});
route.post('/deleteLimit', deleteLimit);
route.post('/deleteMarginLimit', deleteMarginLimit);
route.all('/addOrders', upload.none(), addOrders);

route.all('/addNewRegisteredAddress', upload.none(), addNewRegisteredAddress);
route.all('/deleteRegisteredAddress', upload.none(), deleteRegisteredAddress);
route.all('/getRegisteredAddresses', upload.none(), getRegisteredAddresses);
route.all(
	'/getRegisteredAddressList',
	upload.none(),
	async function (req, res) {
		var api_key_result = req.body.api_key;
	}
);
route.all(
	'/enableWithdrawalWhiteList',
	upload.none(),
	async function (req, res) { }
);
route.post('/editOneStepWithdraw', editOneStepWithdraw);
route.post('/getOneStepWithdraw', getOneStepWithdraw);
route.post('/editWithdrawalWhiteList', editWithdrawalWhiteList);
route.post('/getWithdrawalWhiteList', getWithdrawalWhiteList);
route.all('/addNotification', upload.none(), addNotification);
route.all('/getNotification', upload.none(), getNotification);
route.all('/readNotifications', upload.none(), readNotifications);
route.all('/clearNotifications', upload.none(), clearNotifications);

route.all('/setFavoritePair', upload.none(), SetFavoritePair);
route.all('/getFavoritePairs', upload.none(), GetFavoritePairs);
route.all('/getPairs', upload.none(), getPairs);
route.all('/addPair', upload.none(), addPair);
route.all('/getDigits', upload.none(), getDigits);
route.all('/getCoinList', upload.none(), getCoinList);
route.all('/getCoinNetworks', upload.none(), depositCoinNetworkOptions);
route.all('/getCoinInfo', upload.none(), getCoinInfo);

//Referral Modules
route.all('/getReferral', upload.none(), getReferral);
route.all('/topReferrals', upload.none(), topReferrals);
route.all('/myReferrals', upload.none(), myReferrals);
route.all('/referralRewards', upload.none(), referralRewards);
route.all('/topReferralEarners', upload.none(), topReferralEarners);
route.all('/myReferralEarns', upload.none(), myReferralEarns);
route.all('/request_campus', upload.none(), CampusRequestJoin);
route.all('/getWallet', upload.none(), getWallet);
route.all('/getUserLevel', upload.none(), GetUserLevel);
route.all('/getAllLevelReferrals', upload.none(), getAllLevelReferrals);

route.post('/cancelAllLimit', cancelAllLimit);
route.post('/cancelAllStopLimit', cancelAllStopLimit);
route.all('/cancelOrder', upload.none(), cancelOrder);
route.all('/addSecurityKey', upload.none(), addSecurityKey);
route.all('/updateSecurityKey', upload.none(), updateSecurityKey);
route.all('/lastActivities', upload.none(), lastActivities);
route.all('/activities', upload.none(), activities);
route.all('/updatePhone', upload.none(), updatePhone);
route.all('/resetPassword', upload.none(), resetPassword);
route.all('/getLastLogin', upload.none(), getLastLogin);
route.all('/changePassword', upload.none(), changePassword);
route.all('/updateSocialMedia', upload.none(), UpdateSocialMedia);
route.all('/checkTwitterAccount', upload.none(), checkTwitterAccount);

route.all('/sendMail', upload.none(), sendMail);
route.all('/sendSMS', upload.none(), sendSMS);
route.all('/changeEmail', upload.none(), changeEmail);
route.all('/changePhone', upload.none(), changePhone);
route.all('/get2fa', upload.none(), get2fa);
route.all('/getUserInfo', upload.none(), getUserInfo);
route.all('/updateUserInfo', upload.none(), updateUserInfo);
route.all('/testMail', upload.none(), async function (req, res) {
	mailer.sendMail(
		'volkansaka1@hotmail.com',
		'Test Mail',
		'Test Mail Body',
		function (err, data) {
			if (err) {
				console.log('Error ' + err);
			} else {
				console.log('Email sent successfully');
			}
		}
	);
});

route.all('/getUserId', upload.none(), getUserId);
route.all('/getSecurityKey', upload.none(), getSecurityKey);
route.all('/checkSecurityKey', upload.none(), checkSecurityKey);
route.all('/deleteSecurityKey', upload.none(), deleteSecurityKey);
route.post('/settings', Settings);
route.post('/getAdminSettings', getAdminSettings);
route.post('/addAdmin', addAdmin);
route.post('/adminLogin', Login);
route.all('/changeAvatar', upload.none(), changeAvatar);
route.all('/changeNickName', upload.none(), changeNickname);

route.all('/addCopyTrade', upload.none(), (req, res) => {
	res.json(CopyTrade.test());
});

route.all('/getMarketingMailStatus', upload.none(), marketingMailStatus);
route.all(
	'/changeMarketingMailStatus',
	upload.none(),
	changeMarketingMailStatus
);

route.all('/updateCopyTrade', upload.none(), (req, res) => {
	res.json(CopyTrade.updateTrade());
});
route.all('/addWithdraw', upload.none(), addWithdraw);
route.all('/getDepositsUSDT', upload.none(), getDepositsUSDT);

route.all('/depositHistory', upload.none(), GetDepositHistory);
route.all('/withdrawHistory', upload.none(), GetWithdrawHistory);

route.post('/createApplicant', upload.none(), createApplicant);
route.post('/addDocument', upload.any(), addDocument);
route.post('/getApplicantStatus', upload.none(), getApplicantStatus);
route.post('/getAllFAQS', upload.none(), getAllFaqs);
route.post('/addSupportTicket', addSupportTicket);
route.get('/getSupportTicket', getSupportTicket);
route.all('/deleteSupportTicket', deleteSupportTicket);
route.post('/updateSupportTicket', updateSupportTicket);
route.post('/systemFeedback', addSystemFeedback);
route.get('/price', async function (req, res) {
	let symbol = req.query.symbol;
	if (symbol == null || symbol == '') {
		return res.json({ status: 'fail', message: 'symbol not found' });
	}
	let priceData = await axios(
		'http://18.130.193.166:8542/price?symbol=' + symbol
	);
	console.log(priceData.data);
	if (priceData.data.status == 'success') {
		return res.json({ status: 'succes', data: priceData.data.data });
	}

	return res.json({ status: 'fail', message: 'unknow error' });
});

if (process.env.NODE_ENV == 'product') {
	let sslKEY = fs.readFileSync(
		'/etc/letsencrypt/live/api.oxhain.com/privkey.pem'
	);
	let sslCERT = fs.readFileSync(
		'/etc/letsencrypt/live/api.oxhain.com/fullchain.pem'
	);

	https
		.createServer(
			{
				key: sslKEY,
				cert: sslCERT,
			},
			route
		)
		.listen(port, () => {
			console.log('Server Ayakta');
		});
} else {
	route.listen(port, () => {
		console.log('Server Ayakta');
	});
}
