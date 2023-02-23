const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const FaIssueSubSchema = new mongoose.Schema({
    approxTime: { type: String },
    availableCurrency: { type: Number },
    amountTradeHistory: { type: String }
})
const AccountIssueSubSchema = new mongoose.Schema({
    accountIssue: { type: String }
})
const DepositIssueSubSchema = new mongoose.Schema({
    typeOf: { type: String },
    depositToken: { type: String },
    depositNetwork: { type: String },
    depositAmount: { type: String },
    dateOfDesposit: { type: String },
    recipientWalletAddress: { type: String },
    status: { type: String },
    txId: { type: String }
})
const WithdrawIssueSubSchema = new mongoose.Schema({
    typeOf: { type: String },
    withdrawToken: { type: String },
    withdrawNetwork: { type: String },
    withdrawAmount: { type: String },
    dateOfWithdraw: { type: String },
    recipientWalletAddress: { type: String },
    status: { type: String },
    txId: { type: String }
})
const SuspiciousCaseSubSchema = new mongoose.Schema({
    reportedAddress: { type: String },
    reportedTxId: { type: String }
})
const SpotTradingSubSchema = new mongoose.Schema({
    typeOfIssue: { type: String }
})
const P2PSubSchema = new mongoose.Schema({
    orderNumber: { type: Number }
})
const SupportTickets = new mongoose.Schema({
    user_id: { type: String, required: true },
    issueType: { type: String, require: true },
    email: { type: String, require: true },
    registeredEmailOrPhone: { type: String, required: false, default: null },
    registeredPhone: { type: String, required: false, default: null },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
        type: String, required: true,
        enum: ['low', 'normal', 'high']
    },
    attachment: { type: String, required: false },
    accountIssue: { type: AccountIssueSubSchema },
    fa: { type: FaIssueSubSchema },
    deposit: { type: DepositIssueSubSchema },
    withdraw: { type: WithdrawIssueSubSchema },
    suspiciousCase: { type: SuspiciousCaseSubSchema },
    spotTrading: { type: SpotTradingSubSchema },
    p2p: { type: P2PSubSchema },
    status: { type: String, required: false, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});



module.exports = mongoose.model("SupportTickets", SupportTickets);
