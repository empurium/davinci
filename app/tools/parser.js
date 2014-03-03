var async         = require('async');
var fs            = require('fs');

fs.readFile('./picasa.ini', 'utf8', function(err, data) {
	if (err) throw err;

	var cfg = data.replace(/\r/g, '').split(/\n/);
	var eventInfo   = {};
	var currentFile = '';

	for (var i = 0; i < cfg.length; i++) {
		// process main part of the config
		if (cfg[i] == '[Picasa]') {
			continue;
		}
		if (currentFile === '' && cfg[i].match(/\w+=.*$/)) {
			var info = cfg[i].split(/=/);
			eventInfo[info[0]] = info[1];
		}

		// process each individual file config (hidden, starred, etc)
		if (cfg[i].match(/^\[.*\]$/)) {
			var currentFile   = cfg[i].replace(/^\[/, '').replace(/\]$/, '');
			eventInfo[currentFile] = {};
		}
		if (currentFile != '' && cfg[i].match(/(hidden|starred)=yes$/)) {
			if (cfg[i] === 'hidden=yes') {
				eventInfo[currentFile].hidden = true;
			}
			else if (cfg[i] === 'starred=yes') {
				eventInfo[currentFile].starred = true;
			}
		}
	}

	console.log(eventInfo);
});
