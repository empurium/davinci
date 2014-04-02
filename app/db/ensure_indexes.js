var mongo = require('./mongo');

var out   = function(err, status) { if (err) throw err; console.log(status); };
var events = mongo.db.collection('events');

console.log("Adding indexes:");

console.log(" - events collection");
events.ensureIndex({ name: 1 }, out);
events.ensureIndex({ slug: 1 }, { unique: true }, out);
events.ensureIndex({ year: 1 }, out);
events.ensureIndex({ month: 1 }, out);
events.ensureIndex({ begins: 1 }, out);
events.ensureIndex({ ends: 1 }, out);
events.ensureIndex({ path: 1 }, { unique: true }, out);


