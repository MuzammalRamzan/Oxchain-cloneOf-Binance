const Transactions = require("../../../models/Transactions");

const FutureTransactionHistory = async (ws, user_id, filter) => {
    let request = { user_id: user_id };

    if (filter['type'] != null) {
        if (filter['type'] != 'all')
            request["type"] = filter['type'];
    }




    if (filter['date_from'] != null && filter['date_to'] != null) {
        request['createdAt'] = { $gte: filter['date_from'], $lt: filter['date_to'] };
    }

    let table = await Transactions.find(request);
    ws.send(JSON.stringify({ page: "future", type: 'transaction_history', content: table }));

    Transactions.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let table = await Transactions.find(request);
        ws.send(JSON.stringify({ page: "future", type: 'transaction_history', content: table }));
    });
}
module.exports = FutureTransactionHistory;