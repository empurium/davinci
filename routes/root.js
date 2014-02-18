var Config = require('../app/config');
var mongo  = require('../app/db/mongo');

var root = module.exports = {};

root.root = function(req, res) {
	res.render('pictures.html');

//	if (req.session && req.session.user_id) {
//	} else {
//		res.render('login.html');
//	}
}
