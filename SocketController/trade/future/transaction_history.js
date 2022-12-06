const Transactions = require("../../../models/Transactions");

const FutureTransactionHistory = async (ws, user_id, filter) => {
    let request = { user_id: user_id};
   
    if (filter['type'] == 'all' || filter['type'] == null) {
        request["type"] = filter['type'];
    } 

    if ((filter['side'] != null)) {
        if (filter['side'] != 'all')
            request['type'] = filter['side'];
    }

  
    if(filter['date_from'] != null && filter['date_to'] != null) {
        request['createdAt'] = {$gte : filter['date_from'], $lt : filter['date_to']};
    }

    let data = await Transactions.find(request);
    ws.send(JSON.stringify({ page: "future", type: 'transaction_history', content: data }));
    Transactions.watch([{$match: {operationType : {$in: ['insert', 'update','remove', 'delete']}}}]).on('change', async data => {
        let data = await Transactions.find(request);
        ws.send(JSON.stringify({ page: "future", type: 'transaction_history', content: data }));
    });
}
module.exports = FutureTransactionHistory;