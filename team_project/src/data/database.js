const { MongoClient } = require('mongodb');
let database;

const initDb = (callback) => {
  if (database) {
    console.log('Database already initialized');
    return callback(null, database);
  }
  
  MongoClient.connect(process.env.MONGODB_URI)
    .then(client => {
      database = client.db();
      callback(null, database);
    })
    .catch(err => callback(err));
};

const getDb = () => {
  if (!database) throw Error('Database not initialized');
  return database;
};

module.exports = { initDb, getDb };