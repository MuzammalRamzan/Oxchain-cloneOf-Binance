const Orders = require("./models/Orders");


async function main() {
    let orders = await Orders.find({type:'limit'}).exec();
    let isInsert = MarginOrder.watch([{ $match: { operationType: { $in: ['insert'] } } }]).on('change', async data => {
        //orders = data;
        orders = await MarginOrder.find({ status: 0 }).exec();

    });
    let isUpdate = MarginOrder.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
        orders = await MarginOrder.find({ status: 0 }).exec();
    });
    let isRemove = MarginOrder.watch([{ $match: { operationType: { $in: ['remove'] } } }]).on('change', async data => {
        console.log("silindi");
        orders = await MarginOrder.find({ status: 0 }).exec();
    });

    let isDelete = MarginOrder.watch([{ $match: { operationType: { $in: ['delete'] } } }]).on('change', async data => {
        console.log("silindi 2");
        orders = await MarginOrder.find({ status: 0 }).exec();

    });

    

    const allTickers = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    allTickers.onopen = () => {
        allTickers.onmessage = async (data) => {
            let list = JSON.parse(data.data);
            for (var i = 0; i < list.length; i++) {
                let symbol = list[i].s.replace("/", "");
                for (var k = 0; k < orders.length; k++) {
                    let order = orders[k];
                    if (order.pair_name.replace('/', '') == symbol) {
                        
                    }
                }
            }
        }
    }
}