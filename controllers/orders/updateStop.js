const UpdateStop = async (req, res) => {
    let user_id = req.body.user_id;
    let order_id = req.body.order_id;
    let sl = parseFloat(req.body.sl);
    let tp = parseFloat(req.body.tp);


}

module.exports = UpdateStop;