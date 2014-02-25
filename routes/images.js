var Config = require('../app/config');
var mongo  = require('../app/db/mongo');
var fs     = require('fs');

var images = module.exports = {};

var slash  = Config.slash;

images.thumb = function(req, res) {
	var year    = req.params.year;
	var month   = req.params.month;
	var slug    = req.params.slug;
	var file    = req.params.image;
	var size    = req.query.size;
	var fileExt = getFileExt(file);

	var fullSlug = year + '/' + month + '/' + slug;

	mongo.db.collection('events').findOne({ slug: fullSlug }, function(err, event) {
		if (err) throw err;

		if ( ! event ) {
			res.end('Could not find that event.');
		}

		var filePath = Config.thumbs.path + slash + event.name + slash + file + '-' + size + '.' + fileExt;
		if (fileExt.match(Config.videoTypes)) {
			filePath = filePath + '.jpg';
		}

		if (fs.existsSync(filePath)) {
			var img = fs.readFileSync(filePath);

			res.writeHead(200, {'Content-Type': 'image/jpg' });
			res.end(img, 'binary');
		} else {
			res.end('Could not find image: ' + filePath);
		}
	});
}

images.view = function(req, res) {
	var year    = req.params.year;
	var month   = req.params.month;
	var slug    = req.params.slug;
	var file    = req.params.image;
	var fileExt = getFileExt(file);

	var fullSlug = year + '/' + month + '/' + slug;

	mongo.db.collection('events').findOne({ slug: fullSlug }, function(err, event) {
		if (err) throw err;

		if ( ! event ) {
			res.end('Could not find that event.');
		}

		var filePath = Config.pictures_dir + slash + year + slash + event.name + slash + file;

		if (fs.existsSync(filePath)) {
			var img = fs.readFileSync(filePath);

			if (fileExt.match(Config.imageTypes)) {
				res.writeHead(200, {'Content-Type': 'image/jpg' });
			}
			// specify with more accuracy: http://webdesign.about.com/od/multimedia/a/mime-types-by-content-type.htm
			if (fileExt.match(Config.videoTypes)) {
				res.writeHead(200, {'Content-Type': 'video/quicktime' });
			}

			res.end(img, 'binary');
		} else {
			res.end('Could not find image: ' + filePath);
		}
	});
}


function getFileExt(fileName) {
	var x = fileName.match(/\.(\w{3,4})$/);
	if (x && x.length > 0) {
		return x[1].toLowerCase();
	}
	return false;
}
