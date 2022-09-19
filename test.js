var MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose');

//Create a MongoDB client, open a connection to DocDB; as a replica set,
//  and specify the read preference as secondary preferred

var client = MongoClient.connect(
'mongodb://oxhainadmin:fsDFr3dc53zv42a35asc9z1432bs3x87x2@docdb-2022-09-14-11-39-54.cluster-cx5obo2dvutj.us-east-2.docdb.amazonaws.com:27017/sample-database?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false',
{
  tlsCAFile: `rds-combined-ca-bundle.pem` //Specify the DocDB; cert
},
function(err, client) {
    if(err)
        throw err;

    //Specify the database to be used
    db = client.db('sample-database');

    //Specify the collection to be used
    col = db.collection('sample-collection');

    //Insert a single document
    col.insertOne({'hello':'Amazon DocumentDB'}, function(err, result){
      //Find the document that was previously written
      col.findOne({'hello':'DocDB;'}, function(err, result){
        //Print the result to the screen
        console.log(result);

        //Close the connection
        client.close()
      });
   });
});


//------------

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://oxhainadmin:fsDFr3dc53zv42a35asc9z1432bs3x87x2@docdb-2022-09-14-11-39-54.cluster-cx5obo2dvutj.us-east-2.docdb.amazonaws.com:27017/sample-database?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false',
      {
          useNewUrlParser: true,
          ssl: true,
          sslValidate: true,
          sslCA: `rds-combined-ca-bundle.pem`
      })
}
