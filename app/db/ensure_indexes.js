
var mongo  = require('./mongo');
var events = mongo.db.collection('events');

console.log("Adding indexes:");

console.log(" - events collection");
events.ensureIndex({ name: 1 });
events.ensureIndex({ slug: 1 }, { unique: true });
events.ensureIndex({ year: 1 });
events.ensureIndex({ month: 1 });
events.ensureIndex({ begins: 1 });
events.ensureIndex({ ends: 1 });
events.ensureIndex({ path: 1 }, { unique: true });


process.exit();
