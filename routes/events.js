var Config = require('../app/config');
var mongo  = require('../app/db/mongo');
var _      = require('underscore');

var events = module.exports = {};

events.timeline = function(req, res) {
	if ( ! req.xhr ) { res.end(); return; }

	mongo.db.collection('events').aggregate([
	  { $unwind: "$files" },
	  { $group: { _id: "$year", begins: { $min: "$begins" }, fileCount: { $sum: 1 } } },
	  { $sort: { "_id": -1 } }
	],
	function(err, years) {
		res.send(years);
	});
}

events.search = function(req, res) {
	if ( ! req.xhr ) { res.render('pictures.html'); return; }
	var searchQry = new RegExp(req.params.search, 'i');

	mongo.db.collection('events')
		.find({ name: searchQry })
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
		.find({ begins: { $lte: eventsBegin } })
		.limit(50)
		.sort({ begins: -1 })
		.toArray(function(err, events) {
			res.send(events);
	});
}

events.loadsince = function(req, res) {
	if ( ! req.xhr ) { res.render('pictures.html'); return; }

	eventsBegin = new Date(req.query.begins);

	mongo.db.collection('events')
		.find({ begins: { $lt: eventsBegin } })
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

	// If you are not authorized, do not show hidden files
	/*
	mongo.db.collection('events').findOne({ slug: fullSlug }, function(err, event) {
		req.session.lastEventBegins = event.begins;
		event.files = _.reject(event.files, function(file) {
			if (event.hidden.indexOf(file) === -1) {
				return false;
			}
			return true;
		});
		delete event.hidden;

		res.send(event);
	});
	*/
	mongo.db.collection('events').findOne({ slug: fullSlug }, function(err, event) {
		if (err) throw err;

		if (event) {
			req.session.lastEventBegins = event.begins;
			res.send(event);
		} else {
			res.send({});
		}
	});
}
