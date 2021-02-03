const MongoClient = require('mongodb').MongoClient;
const dbServer = 'mongodb://localhost:27017/';
const dbName = 'CFECardsManageToolDatabase';

// check user exsist
function userExsist(gmail){
    return new Promise((resolve, reject)=>{
        MongoClient.connect(dbServer, function(err, client){
            if(err)reject(err);
            try{
                var db = client.db(dbName);
                var collection = db.collection('user');
                var cursor = collection.find({'gmail':gmail});

                cursor.count((err, count)=>{
                    resolve(count==1);
                });
            }catch(err){
                reject(err)
            }
            client.close();
        });
    });
}

module.exports = {
    userExsist,
};