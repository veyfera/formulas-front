const { MongoClient } = require('mongodb');

const config = require('./config');

const client = new MongoClient(config.mongo_uri);
let collection;

function connect() {
    return new Promise(function (resolve, reject) {
        client.connect(err => {
            if (err) reject(err);
            collection = client.db(config.mongo_database).collection(config.mongo_collection);
            collection.deleteMany({}).then(resolve);
        });
    });
}

async function run(ast, scope) {
    if (!collection) await connect();

    for (let i = 0; i < 100000; i++) {
        const document = {};

        for (let j = 0; j < 100; j++) {
            // if (Math.random() > 0.5) {
                document[`var${j}`] = Math.random() * 100000;
            // } else {
            //     document[`var${j}`] = 'u' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            // }
        }

        await collection.insertOne(document);
    }
}

run();