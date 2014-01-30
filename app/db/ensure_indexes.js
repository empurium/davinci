
var mongo  = require('./mongo');
var events = mongo.db.collection('events');

console.log("Adding indexes:");

console.log(" - events collection");
events.ensureIndex({ email: 1 }, { unique: true });


process.exit();
