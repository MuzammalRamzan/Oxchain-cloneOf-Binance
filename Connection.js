const mongoose = require("mongoose");
async function connection() {
    console.log("mongodb://" +
        process.env.DOCUMENT_DB_UID
        + ":" +
        process.env.DOCUMENT_DB_PASS
        + "@13.59.10.128:27017/?retryWrites=true&w=majority")
    await mongoose.connect("mongodb://" +
        process.env.DOCUMENT_DB_UID
        + ":" +
        process.env.DOCUMENT_DB_PASS
        + "@13.59.10.128:27017/?retryWrites=true&w=majority");
    console.log(mongoose.connection.readyState);
    console.log("DB Connected");

    return;
    var mongodbPass = process.env.MONGO_DB_PASS;
    if (process.env.NODE_ENV == 'development') {
        await mongoose.connect("mongodb+srv://volkansaka:" +
            mongodbPass +
            "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority");
    } else {
        await mongoose.connect("mongodb://" +
            process.env.DOCUMENT_DB_UID
            + ":" +
            process.env.DOCUMENT_DB_PASS
            + "@docdb-2022-09-14-11-39-54.cluster-cx5obo2dvutj.us-east-2.docdb.amazonaws.com:27017/test?replicaSet=rs0&retryWrites=true&w=majority", {
            ssl: true,
            sslValidate: false,
            sslCA: "./rds-combined-ca-bundle.pem",
            retryWrites: false
        });
    }

    console.log("Connected");

}

module.exports = { connection: connection };