var Config = module.exports = {};

Config.port = 3000;
Config.host = 'localhost';
Config.session_secret = 'porkchopsandwiches';
Config.cookie_secret  = 'quesadillatacos';

// use '\\' on Windows
Config.slash = '/';

// Directory containing Events pictures, no trailing slash
//Config.pictures_root = '/space/Pictures/Permanent';
Config.pictures_root = 'Pictures';

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
