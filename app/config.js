var Config = module.exports = {};

Config.port = 3000;
Config.host = 'localhost';
Config.session_secret = 'porkchopsandwiches';
Config.cookie_secret  = 'quesadillatacos';

// use '\\' on Windows
Config.slash = '/';

// Directory containing Events pictures, no trailing slash
//Config.pictures_dir = '/space/Pictures/Permanent';
Config.pictures_dir = 'Pictures';

// Directory to save the thumbnails. Could change to S3 in the future
Config.thumbs = {
	path:  '/tmp/thumbnails',
	sizes: [
		'128x128',
		'200x200',
		'640x640',
		'960x960'
	]
}

Config.cli = {
	// exiftool is available at:
	// http://www.sno.phy.queensu.ca/~phil/exiftool/
	exiftool: '/usr/local/bin/exiftool',

	// convert is part of imagemagick
	// (apt-get|brew) install imagemagick
	convert:  '/usr/local/bin/convert'
}

Config.mongo = {
  host: 'localhost',
  port: '27017',
  db:   'davinci'
}

Config.project = {
	name:             'DaVinci',
	name_lc:          'davinci',
	domain:           'davinci.com',
	domain_pretty:    'davinci.com',
	site_title:       'DaVinci Web Gallery'
}

Config.daemons = {
	root:             '/home/empurium/code/davinci/app/daemons/'
}

Config.bcrypt_salt = 10;
