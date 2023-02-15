const { default: axios } = require("axios");
const ContractAddress = require("../../models/ContractAddress");
const Deposits = require("../../models/Deposits");
const SkipDeposits = require("../../models/SkipDeposits");
const WalletAddress = require("../../models/WalletAddress");
const utilities = require("../../utilities");

const checkSOLDeposit = async () => {
    try {
        let networkId = "63638ae4372052a06ffaa0be";
        
        let wallets = await WalletAddress.find({
            network_id: networkId,
        }).exec();

        for (var i = 0; i < wallets.length; i++) {
            let w = wallets[i];
            let post = await axios.get("https://api.solscan.io/account/transaction?address=" + w.wallet_address + "&cluster=", {
                headers: {
                    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                    "origin": "https://solscan.io",
                    "referer": "https://solscan.io",
                }
            });
            let results = post.data;

            for (var k = 0; k < results.data.length; k++) {
                let obj = results.data[k];
                let tx_id = obj.txHash;
                
                if(obj.signer[0] == w.wallet_address) continue;

                let check = await Deposits.findOne({ tx_id: tx_id });
                if (check == null) {
                    let getHashDetail = await axios.get("https://api.solscan.io/transaction?tx=" + tx_id + "&cluster=", {
                        headers: {
                            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                            "origin": "https://solscan.io",
                            "referer": "https://solscan.io",
                        }
                    })
                    let mainActions = getHashDetail.data.mainActions[0];
                    if(mainActions.action == 'spl-transfer') {
                        if(mainActions.data.destination_owner == w.wallet_address) {
                            let splitter = "1";
                            for(var n = 0; n < mainActions.data.token.decimals; n++) {
                                splitter += "0";
                            }

                            let amount = mainActions.data.amount / parseFloat(splitter);
                            let getContractInfo = await ContractAddress.findOne({contract:mainActions.data.token.address });
                            if(getContractInfo == null) continue;
                            
                            utilities.addDeposit(
                                w.user_id,
                                mainActions.data.token.symbol,
                                amount,
                                w.wallet_address,
                                tx_id,
                                getContractInfo.coin_id,
                                networkId,
                                mainActions.data.source_owner
                              );
                         
                        }
                    } else if(mainActions.action == 'sol-transfer') {
                        if(mainActions.data.destination == w.wallet_address) {
                            const coinID = "63625ff4372052a06ffaa0af";
                            let amount = mainActions.data.amount / 1000000000;
                            utilities.addDeposit(
                                w.user_id,
                                "SOL",
                                amount,
                                w.wallet_address,
                                tx_id,
                                coinID,
                                networkId,
                                mainActions.data.source
                              );   
                        }
                    }
                    
                    
                    
                }
            }
        }
    } catch (err) {
        console.log("SOL Deposit err : ", err.message);
    }
}

module.exports = checkSOLDeposit;