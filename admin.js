'use strict';
const Connection = require('./Connection');
const bodyParser = require('body-parser');
const multer = require('multer');
const express = require('express');
const cors = require('cors');

require('dotenv').config();

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
var port = 3003;

const Login = require('./adminController/Login');
const Profit = require('./adminController/Profit');
const Admin = require('./adminController/Admin');
const User = require('./adminController/User');
const Bonus = require('./adminController/Bonus');
const Deposit = require('./adminController/Deposit');
const Pairs = require('./adminController/Pairs');
const Wallet = require('./adminController/Wallet');
const Withdraw = require('./adminController/Withdraw');
const Earnings = require('./adminController/Earnings');
const AdminDashboard = require('./adminController/AdminDashboard');
const GetKyc = require('./adminController/GetKyc');
const ApproveKyc = require('./adminController/ApproveKyc');
const ApproveRecidency = require('./adminController/ApproveRecidency');
const DenyKyc = require('./adminController/DenyKyc');
const { getUsersDetails } = require('./adminController/getUserDetails');
//refferals
const { getAllRefferals } = require('./adminController/Referral');
//supportTeam
const {
	addSupportTeamMember,
	searchSupportTeamMember,
} = require('./adminController/supportTeam/support');
//Agents
const { createAgent, getAllAgents } = require('./adminController/Agent');
//Faqs
const {
	createFAQMember,
	getAllFAQMembers,
} = require('./adminController/FAQS/FAQTeam');
const createFAQs = require('./adminController/FAQS/createFAQs');
const updateFAQs = require('./adminController/FAQS/updateFAQs');
const deleteFAQs = require('./adminController/FAQS/deleteFAQs');
//posts
const createPost = require('./adminController/Posts/createPost');
//trades
const getTrades = require('./adminController/Trades/getTrades');

const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

route.use(function (err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
		res.status(401).send('error: invalid token');
	} else {
		next(err);
	}
});

route.get('/', (req, res) => {
	res.send('success');
});

route.all('/login', upload.none(), Login);
route.all('/addAdmin', upload.none(), Admin.addAdmin);
route.all('/editAdmin', upload.none(), Admin.editAdmin);
route.all('/ApproveKyc', upload.none(), ApproveKyc);
route.all('/ApproveRecidency', upload.none(), ApproveRecidency);
route.all('/DenyKyc', upload.none(), DenyKyc);
route.all('/GetKyc', upload.none(), GetKyc);

route.all('/listAdmin', upload.none(), Admin.listAdmin);
route.all('/getAdmin', upload.none(), Admin.getAdmin);
route.all('/editUser', upload.none(), User.editUser);
route.all('/BanUser', upload.none(), User.BanUser);
route.all('/ReBanUser', upload.none(), User.ReBanUser);
route.all('/getAllBannedUser', upload.none(), User.getAllBannedUser);
route.all('/getUser', upload.none(), User.getUser);
route.all('/filterUser', upload.none(), User.filterUser);
route.all('/userList', upload.none(), User.userList);
route.all('/denyApplicant', upload.none(), User.denyApplicant);
route.all('/setBonusRate', upload.none(), Bonus.setBonusRate);
route.all('/exportDepositsData', upload.none(), Deposit.exportDepositsData);
route.all('/totalDeposits', upload.none(), Deposit.totalDeposits);
route.all('/depositReport', upload.none(), Deposit.totalDepositGraphData);
route.all('/depositList', upload.none(), Deposit.listDeposits);
route.all('/getUserDeposits', upload.none(), Deposit.getUserDeposits);
route.all('/listPairs', upload.none(), Pairs.listPairs);
route.all('/setPairFee', upload.none(), Pairs.setPairFee);
route.all('/getUserBalance', upload.none(), Wallet.getUserBalance);
route.all('/getWalletBalance', upload.none(), Wallet.getWalletBalance);
route.all('/setBalance', upload.none(), Wallet.setBalance);
route.all('/totalWithdrawn', upload.none(), Withdraw.totalWithdrawn);
route.all('/withdrawReport', upload.none(), Withdraw.totalWithdrawGraphData);
route.all('/listWithdraws', upload.none(), Withdraw.listWithdraws);
route.all('/getUserWithdraw', upload.none(), Withdraw.getUserWithdraw);
route.all('/exportWithdrawData', upload.none(), Withdraw.exportWithdrawData);
route.all('/getProfit', upload.none(), Profit.ProfitAll);
route.all('/getEarnings', upload.none(), Earnings.getEarnings);
route.all('/addEarning', upload.none(), Earnings.AddEarning);
route.all('/getAdminDashboard', upload.none(), AdminDashboard.getData);
route.all('/getUsersDetails', upload.none(), getUsersDetails);
//Refferals
route.all('/getAllRefferals', upload.none(), getAllRefferals);
//supportTeam apis
route.all('/addSupportTeamMember', upload.none(), addSupportTeamMember);
route.all('/searchSupportTeamMember', upload.none(), searchSupportTeamMember);
//Agents apis router
route.all('/createAgent', upload.none(), createAgent);
route.all('/getAllAgents', upload.none(), getAllAgents);
//create news,blogs or posts
route.all('/createPost', upload.none(), createPost);
//Trades
route.all('/getTrades', upload.none(), getTrades);
//FAQS apis router
route.all('/createFAQMember', upload.none(), createFAQMember);
route.all('/getAllFAQMembers', upload.none(), getAllFAQMembers);
route.all('/FAQS/create', upload.none(), createFAQs);
route.all('/FAQS/update/:id', upload.none(), updateFAQs);
route.all('/FAQS/delete/:id', upload.none(), deleteFAQs);
route.listen(port, () => {
	console.log('Server Ayakta');
});
