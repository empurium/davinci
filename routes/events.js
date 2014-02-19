var Config = require('../app/config');
var mongo  = require('../app/db/mongo');

var events = module.exports = {};

events.events = function(req, res) {
	if ( ! req.xhr ) { res.render('pictures.html'); return; }

	mongo.db.collection('events')
		.find()
		.limit(50)
		.sort({ begins: -1 })
		.toArray(function(err, events) {
			res.send(events);
	});
}

events.event = function(req, res) {
	if ( ! req.xhr ) { res.render('pictures.html'); return; }

	var year    = req.params.year;
	var month   = req.params.month;
	var slug    = req.params.slug;

	var fullSlug = year + '/' + month + '/' + slug;

	mongo.db.collection('events').findOne({ slug: fullSlug }, function(err, event) {
		res.send(event);
	});
}
