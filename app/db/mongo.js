
var mongoskin = require('mongoskin');
var Config    = require('../config.js');
var db_url = Config.mongo.host + ':' + Config.mongo.port + '/' + Config.mongo.db + '?auto_reconnect';

var mongo = module.exports = {};

mongo.db = mongoskin.db(db_url, { journal: true });

console.log("Connected to " + db_url + " with mongoskin");
