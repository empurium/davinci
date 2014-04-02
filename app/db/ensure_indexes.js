var mongo = require('./mongo');

var noop   = function() {};
var events = mongo.db.collection('events');

console.log("Adding indexes:");

console.log(" - events collection");
events.ensureIndex({ name: 1 }, noop);
events.ensureIndex({ slug: 1 }, { unique: true }, noop);
events.ensureIndex({ year: 1 }, noop);
events.ensureIndex({ month: 1 }, noop);
events.ensureIndex({ begins: 1 }, noop);
events.ensureIndex({ ends: 1 }, noop);
events.ensureIndex({ path: 1 }, { unique: true }, noop);


process.exit();
