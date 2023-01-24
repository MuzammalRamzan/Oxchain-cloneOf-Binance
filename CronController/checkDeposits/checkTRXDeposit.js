const axios = require('axios');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const WalletAddress = require('../../models/WalletAddress');
const CoinList = require('../../models/CoinList');
const ContractAddressSchema = require('../../models/ContractAddress');
const Deposits = require('../../models/Deposits');
var authFile = require('../../auth.js');

const utilities = require('../../utilities');
require('dotenv').config();
const checkTRXDeposit = async () => {
	try {
		let networkId = '6358f17cbc20445270757291';
		let wallet = await WalletAddress.find({
			network_id: networkId,
		}).exec();

		let tx_id = '';
		let user_id = '';
		let amount = '';
		let address = '';
		let deposit = '';

		for (let i = 0; i < wallet.length; i++) {
			let address = wallet[i].wallet_address;

			let user_id = wallet[i].user_id;
			if (address.length > 1) {
				let checkRequest = await axios.get(
					'https://apilist.tronscan.org/api/transaction?sort=-timestamp&count=true&limit=20&start=0&address=' +
						address,
					{
						headers: {
							'User-Agent':
								'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
						},
					}
				);
				let result = checkRequest.data;
				if (result.total == 0) continue;
				let dataset = result.data;
				if (dataset == null) continue;

				for (let j = 0; j < dataset.length; j++) {
					let item = dataset[j];
					if (item.contractRet == 'SUCCESS' && item.confirmed == 1) {
						if (item.ownerAddress == process.env.TRCADDR) continue;
						if (
							item.toAddress.toLocaleLowerCase() != address.toLocaleLowerCase()
						)
							continue;
						let tokenAbbr = item.tokenInfo.tokenAbbr;
						let tokenId = item.tokenInfo.tokenId;
						if (
							item.contractType == 1 &&
							tokenAbbr == 'trx' &&
							tokenId == '_'
						) {
							let contractData = item.contractData;

							tx_id = item.hash;
							amount = contractData.amount;

							if (amount < 13000000) continue;

							deposit = await Deposits.findOne({
								user_id: user_id,
								tx_id: tx_id,
							}).exec();

							if (deposit === null) {
								utilities.addDeposit(
									user_id,
									'TRX',
									amount / 1000000.0,
									address,
									tx_id,
									'62b053c444fd000839751741',
									networkId
								);
							}
						}
					}
				}
			}
		}
	} catch (err) {
		console.log('TRX Deposit err : ', err.message);
	}
};

module.exports = checkTRXDeposit;
