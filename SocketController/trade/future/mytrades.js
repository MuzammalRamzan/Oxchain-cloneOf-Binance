const mytrades = async (sockets, user_id) => {
    let token = user_id;
    user_id = user_id.substring(0, user_id.indexOf('-'));
    let orders = await FutureOrder.find({ user_id: user_id, $or: [{ method: "limit" }, { method: "stop_limit" }], status: 1 }).limit(10);
}