const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth');
const UserRef = require('../../models/UserRef');
const FutureWalletModel = require('../../models/FutureWalletModel');

const mongoose = require('mongoose');

const getAllRefUser = async (req, res) => {
	try {
		const apiKey = req.body.api_key;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}
		const refUsers = await UserRef.find();

		const userIds = refUsers.map((refUser) => refUser.user_id);

		const userTotals = [];

		for (let i = 0; i < userIds.length; i++) {
			const futureSum = await FutureWalletModel.aggregate([
				{
					$match: {
						user_id: {
							$eq: userIds[i],
						},
					},
				},
				{
					$group: {
						_id: null,
						totalFutureVolume: { $sum: '$amount' },
					},
				},
			]);

			const fees = await FeeModel.aggregate([
				{
					$match: {
						to_user_id: mongoose.Types.ObjectId(userIds[i]),
					},
				},
				{
					$group: {
						_id: null,
						totalAmount: { $sum: '$amount' },
					},
				},
			]);

			const commision = fees.length > 0 ? fees[0].totalAmount : 0;
			const futureTotal =
				futureSum.length > 0 ? futureSum[0].totalFutureVolume : 0;

			userTotals.push({
				user_id: userIds[i],
				commission: commision,
				futureSum: futureTotal,
			});
		}

		// const refUsers = await UserRef.find();

		// const userIds = refUsers.map((refUser) => refUser.user_id);
		// for (let i = 0; i < userIds.length; i++) {
		// 	futureSum = await FutureWalletModel.aggregate([
		// 		{
		// 			$match: {
		// 				user_id: {
		// 					$eq: userIds[i],
		// 				},
		// 			},
		// 		},
		// 		{
		// 			$group: {
		// 				_id: null,
		// 				totalFutureVolume: { $sum: '$amount' },
		// 			},
		// 		},
		// 	]);
		// 	console.log(futureSum);
		// }

		// fees = await FeeModel.aggregate([
		// 	{
		// 		$match: {
		// 			to_user_id: {
		// 				$in: userIds.map((userId) => mongoose.Types.ObjectId(userId)),
		// 			},
		// 		},
		// 	},
		// 	{
		// 		$group: {
		// 			_id: '$to_user_id',
		// 			totalAmount: { $sum: '$amount' },
		// 		},
		// 	},
		// ]);

		// const feesWithUserIds = userIds.map((userId) => {
		// 	const userFees = fees.find((fee) => fee._id.equals(userId));
		// 	const commision = userFees ? userFees.totalAmount : 0;
		// 	return {
		// 		user_id: userId,
		// 		commision: commision === 0 ? 0 : commision,
		// 	};
		// });

		res.json({
			status: 'success',
			message: 'Users Refferal Data',
			data: userTotals,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = getAllRefUser;
