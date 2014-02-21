var Config = require('../app/config');
var mongo  = require('../app/db/mongo');

var events = module.exports = {};

// NOTE: These NEED to be removed once thumbnail generation is working for them:
// thumb: { $not: /(mpg|mov|png)$/i }


events.search = function(req, res) {
	if ( ! req.xhr ) { res.render('pictures.html'); return; }
	var searchQry = new RegExp(req.query.search, 'i');

	mongo.db.collection('events')
		.find({ name: searchQry, thumb: { $not: /(mpg|mov|png)$/i } })
		.limit(50)
		.sort({ begins: -1 })
		.toArray(function(err, events) {
			res.send(events);
	});
}

events.recent = function(req, res) {
	if ( ! req.xhr ) { res.render('pictures.html'); return; }

	var eventsBegin = new Date();
	if (req.session.lastEventBegins) {
		eventsBegin = new Date(req.session.lastEventBegins);
	}

	mongo.db.collection('events')
		.find({ begins: { $lte: eventsBegin }, thumb: { $not: /(mpg|mov|png)$/i } })
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
		req.session.lastEventBegins = event.begins;
		res.send(event);
	});
}
