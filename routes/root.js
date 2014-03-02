var Config = require('../app/config');
var mongo  = require('../app/db/mongo');

var root = module.exports = {};

root.root = function(req, res) {
	if ( ! req.xhr ) {
		req.session.lastEventBegins = new Date();
		res.render('pictures.html');
		return;
	}

//	if (req.session && req.session.user_id) {
//	} else {
//		res.render('login.html');
//	}
}
