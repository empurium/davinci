var Config = require('../app/config');
var mongo  = require('../app/db/mongo');

var bcrypt = require('bcrypt');

var user = module.exports = {};

user.logout = function(req, res) {
	req.session = '';
	res.writeHead(302, { Location: '/' });
	res.end();
}

user.account = function(req, res) {
	mongo.db.collection('users').findById( req.session.user_id, function(err, user) {
		if (err) { throw err; };

		res.render('user/info.html', {
			page: { account: true },
			user: user,
			brand: Config.brand
		});
	});
}

user.login = function(req, res) {
	mongo.db.collection('users').findOne({
		email: req.body.email
	},
	function(err, user) {
		if (err) { throw (err); }

		// found our user, check password
		if (user) {
			bcrypt.compare(req.body.password, user.password_hash, function(err, correctPass) {
				if (err) { throw(err); }

				if (correctPass) {
					req.session.user_id = user._id;
					if (req.xhr) {
						res.json({
							login: 'success'
						});
					} else {
						res.writeHead(302, { Location: '/' });
						res.end();
					}
				} else {
					if (req.xhr) {
						res.json({
							login: 'incorrect'
						});
					} else {
						res.writeHead(200, { Location: '/#login' });
						res.end();
					}
				}
			});
		}

		// did not find user, automatically begin signup :)
		else {
			bcrypt.genSalt(Config.bcrypt_salt, function(err, salt) {
				if (err) { throw(err); }

				bcrypt.hash(req.body.password, salt, function(err, hash) {
					if (err) { throw(err); }

					mongo.db.collection('users').insert({
						email: req.body.email,
						password_hash: hash
					},
					{},
					function() {
						console.log('created a new user!');
					});
				});
			});
		}
	});
}
