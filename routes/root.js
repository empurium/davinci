var Config = require('../app/config');
var mongo  = require('../app/db/mongo');

var root = module.exports = {};

root.root = function(req, res) {
	if (req.session && req.session.user_id) {
		mongo.db.collection(Config.mongo.db)
			.find()
			.limit(50)
			.toArray(function(err, events) {
				res.render('events.html', {
					events: events
				});
		});
	} else {
		res.render('login.html');
	}
}
