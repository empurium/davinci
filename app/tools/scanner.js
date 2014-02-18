var Config        = require('../config');
var mongo         = require('../db/mongo');
var async         = require('async');
var fs            = require('fs');
var child_process = require('child_process');
var mkdirp        = require('mkdirp');

var slash       = Config.slash;
var imageTypes  = /jpg/i;
var videoTypes  = /(mp4|mov|mts|mpg)/i;

var eventInfo = [];


// assumes Pictures/Year/Event Name/files.*
fs.readdir(Config.pictures_dir, function(err, years) {
	if (err) throw err;

	// We could look in here and traverse more intelligently:
	//
	// If it's a directory and there are files within it, we could
	// assume it's an Event.
	//
	// If it's a directory and there is another directory within
	// it, we could assume it's an irrelevant directory name (year
	// in our case, but could be 'family pics', etc)
	//
	// Either way, we would only assume it's an Event if it's a
	// directory with nothing but files in it (excluding .picasaoriginals)

	async.eachLimit(years, 1, function iter(year, nextYear) {
		var yearDir = Config.pictures_dir + slash + year;

			fs.readdir(yearDir, function(err, events) {
				if (err) throw err;

				async.eachLimit( events, 3, function iter(eventName, nextEvent) {
					var eventDir = Config.pictures_dir + slash + year + slash + eventName;

					scanEventFiles(eventDir, eventName, function() {
						nextEvent();
					});
				});
			});
			//nextYear(); // Where to call this?
		});
	}
);




function scanEventFiles(eventDir, eventName, nextEvent) {
	eventInfo[eventDir]          = [];
	eventInfo[eventDir]['files'] = [];

	var eventStart = new Date();
	var eventEnd   = new Date();
	var files = fs.readdirSync(eventDir);

	// if the event has JPG files, let's skip video files
	// JPG files are 1000x more reliable and accurate
	files.forEach(function(fileName) {
		var fileExt = getFileExt(fileName);
		if (fileExt && fileExt.match(imageTypes)) {
			eventInfo[eventDir]['skip_videos'] = true;
		}
		if (fileExt && fileExt.match(videoTypes)) {
			eventInfo[eventDir]['videos_exist'] = true;
		}
	});

	async.eachLimit(files, 5,
		function iter(fileName, next) {
			var fileExt = getFileExt(fileName);

			getFileDate(eventDir, fileName, function(fileDate) {
				if (fileDate === false || fileName === '.picasa.ini') {
					return next();
				}

				if (fileDate < eventStart) {
					eventStart = fileDate;
					eventEnd   = eventStart;
				}

				// only set the event end date if it's a file with EXIF
				if (fileExt && fileExt.match(imageTypes)) {
					if (fileDate > eventEnd) {
						eventEnd = fileDate;
					}
				}

				eventInfo[eventDir]['start'] = eventStart;
				eventInfo[eventDir]['end']   = eventEnd;
				eventInfo[eventDir]['files'].push(fileName);

				if (fileExt && fileExt.match(imageTypes)) {
					genThumbnails(eventName, eventDir, fileName, function() {
						return next();
					});
				} else {
					return next();
				}
			});
		},
		function done(err) {
			var year  = eventStart.getFullYear();
			var month = eventEnd.getMonth() * 1 + 1;
			    month = (month < 10) ? '0' + month : month;

			console.log(eventName + ' (' + files.length + ' files):');
			console.log(' -> started ' + eventStart);
			console.log(' -> ended   ' + eventEnd);
			if (eventInfo[eventDir]['skip_videos'] && eventInfo[eventDir]['videos_exist']) {
				console.log(' -> (JPG found - skipped video files)');
			}

			mongo.db.collection('events').findOne({
				name:  eventName,
				year:  year,
				month: month
			},
			function (err, event) {
				if (err) throw err;

				if (event) {
					// update the event times
					// update the list of files
					nextEvent();
				} else {
					mongo.db.collection('events').insert({
						name:    eventName,
						year:    year,
						month:   month,
						begins:  eventStart,
						ends:    eventEnd,
						path:    eventDir,
						files:   [ files ]
					},
					{},
					function() {
						nextEvent();
					});
				}
			});
		}
	);
}

function getFileDate(eventDir, fileName, callback) {
	var filePath = eventDir + slash + fileName;
	var fileExt  = getFileExt(fileName);
	var fileDate = false;

	// JPG files - always prefer EXIF metadata
	if (fileExt && fileExt.match(imageTypes)) {
		getImageExifDate(filePath, function(fileDate) {
			callback(fileDate);
		});
	}

	// Video files - always prefer XMP metadata
	else if (fileExt && fileExt.match(videoTypes)) {
		if (eventInfo[eventDir]['skip_videos']) {
			callback(false);
		} else {
			getVideoExifDate(filePath, function(fileDate) {
				callback(fileDate);
			});
		}
	}

	// File Timestamps - fallback (least accurate)
	else {
		getPhysicalDate(filePath, function(fileDate) {
			callback(fileDate);
		});
	}
}

function genThumbnails(eventName, eventDir, fileName, callback) {
	var filePath = eventDir + slash + fileName;
	var fileExt  = getFileExt(fileName);

	async.eachLimit(Config.thumbs.sizes, 5,
		function iter(size, next) {
			var thumbPath = Config.thumbs.path + slash + eventName;
			var thumbFile = thumbPath + slash + fileName + '-' + size + '.' + fileExt;
			var options = [
				'-define', 'jpeg:size=' + size,
				'-gravity', 'center',
				'-thumbnail', size + '^',
				'-extent', size,
				'-auto-orient',
				filePath,
				thumbFile
			];

			mkdirp(thumbPath, function(err) {
				if (err) throw err;

				if ( ! fs.existsSync(thumbFile) ) {
					child_process.execFile(Config.cli.convert, options, {}, function(err, stdout) {
						if (err) throw err;
						next();
					});
				} else {
					next();
				}
			});
		},
		function done() {
			callback();
		}
	);
}


function parseDate(dateString) {
	// 2012:10:30 19:09:16
	var parts = dateString.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
	return new Date(parts[1], parts[2]-1, parts[3], parts[4], parts[5], parts[6]);
}

function getFileExt(fileName) {
	var x = fileName.match(/\.(\w{3,4})$/);
	if (x && x.length > 0) {
		return x[1];
	}
	return false;
}


function getPhysicalDate(filePath, callback) {
	fs.stat(filePath, function(err, stat) {
		var fileDate = stat.mtime || stat.ctime || stat.atime;
		callback(fileDate);
	});
}

function getImageExifDate(filePath, callback) {
	child_process.execFile(Config.cli.exiftool, ['-j', filePath], {}, function(err, stdout) {
		var stdout   = JSON.parse(stdout.toString());
		var stdout   = stdout[0];
		var fileDate = false;

		if (stdout.DateTimeOriginal) {
			fileDate = parseDate(stdout.DateTimeOriginal);
		}
		else if (stdout.CreateDate) {
			fileDate = parseDate(stdout.CreateDate);
		}
		else if (stdout.ModifyDate) {
			fileDate = parseDate(stdout.ModifyDate);
		}
		else if (stdout.FileModifyDate) {
			fileDate = parseDate(stdout.FileModifyDate);
		}
		// FileInodeChangeDate and FileAccessDate are typically just today

		if (fileDate !== false) {
			callback(fileDate);
		} else {
			getPhysicalDate(filePath, function(fileDate) {
				callback(fileDate);
			});
		}
	});
}

function getVideoExifDate(filePath, callback) {
	child_process.execFile(Config.cli.exiftool, ['-j', filePath], {}, function(err, stdout) {
		var stdout   = JSON.parse(stdout.toString());
		var stdout   = stdout[0];
		var fileDate = false;

		if (stdout.TrackCreateDate) {
			fileDate = parseDate(stdout.TrackCreateDate);
		}
		else if (stdout.TrackModifyDate) {
			fileDate = parseDate(stdout.TrackModifyDate);
		}
		else if (stdout.MediaCreateDate) {
			fileDate = parseDate(stdout.MediaCreateDate);
		}
		else if (stdout.MediaModifyDate) {
			fileDate = parseDate(stdout.MediaModifyDate);
		}
		else if (stdout.ModifyDate) {
			fileDate = parseDate(stdout.ModifyDate);
		}
		// FileInodeChangeDate and FileAccessDate are typically just today

		if (fileDate !== false) {
			callback(fileDate);
		} else {
			getPhysicalDate(filePath, function(fileDate) {
				callback(fileDate);
			});
		}
	});
}
