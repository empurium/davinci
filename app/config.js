var Config = module.exports = {};

Config.port = 3001;
Config.host = 'localhost';
Config.session_secret = 'porkchopsandwiches';
Config.cookie_secret  = 'quesadillatacos';

// use '\\' on Windows
Config.slash = '/';

// File types
Config.imageTypes = /(jpg|png)/i;
Config.videoTypes = /(mov|mp4|mpg|avi|mts|3gp|wmv)/i;

// Directory containing Events pictures, no trailing slash
Config.pictures_dir = '/space/Pictures';
//Config.pictures_dir = 'Pictures';

// Directory to save the thumbnails. Could change to S3 in the future
Config.thumbs = {
	path:  '/tmp/thumbnails',
	sizes: [
		'128x128',
		'220x220',
		'640',
		'1024'
	]
}

Config.cli = {
	// used for parsing EXIF data on images and videos to detect
	// beginning and end dates of events.
	//
	// exiftool is available at:
	// http://www.sno.phy.queensu.ca/~phil/exiftool/
	exiftool: '/usr/local/bin/exiftool',

	// used for generating thumbnails of images
	//
	// convert is part of imagemagick
	// (apt-get|brew) install imagemagick
	convert:  '/usr/local/bin/convert',

	// used for generating thumbnails of videos
	//
	// (apt-get|brew) install ffmpeg
	ffmpeg:  '/usr/bin/ffmpeg'
}

Config.mongo = {
  host: 'localhost',
  port: '27017',
  db:   'davinci'
}

Config.daemons = {
	root:             '/home/empurium/code/davinci/app/daemons/'
}

Config.bcrypt_salt = 10;
