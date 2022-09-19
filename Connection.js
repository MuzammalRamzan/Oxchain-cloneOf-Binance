const mongoose = require("mongoose");
async function connection() {

    var mongodbPass = process.env.MONGO_DB_PASS;

    var connection = process.env.NODE_ENV == 'development' ?
        "mongodb+srv://volkansaka:" +
        mongodbPass +
        "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority" :
        "mongodb://" +
        process.env.DOCUMENT_DB_UID
        + ":" +
        process.env.DOCUMENT_DB_PASS
        + "@docdb-2022-09-14-11-39-54.cluster-cx5obo2dvutj.us-east-2.docdb.amazonaws.com:27017/sample-database?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
        ;


    await mongoose.connect(connection);

}

module.exports = {connection:connection};