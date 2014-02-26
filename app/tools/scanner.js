var Config        = require('../config');
var mongo         = require('../db/mongo');
var async         = require('async');
var fs            = require('fs');
var child_process = require('child_process');
var mkdirp        = require('mkdirp');

var slash = Config.slash;

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

	async.eachLimit(years, 1,
		function iter(year, nextYear) {
			var yearDir = Config.pictures_dir + slash + year;

				fs.readdir(yearDir, function(err, events) {
					if (err) throw err;

					async.eachLimit( events, 3,
						function iter(eventName, nextEvent) {
							var eventDir = Config.pictures_dir + slash + year + slash + eventName;

							scanEventFiles(eventDir, eventName, function() {
								nextEvent();
							});
						},
						function done(err) {
							nextYear();
						}
					);
				});
			},
			function done() {
				console.log('Scan complete!');
				process.exit();
			}
		);
	}
);




function scanEventFiles(eventDir, eventName, nextEvent) {
	eventInfo[eventDir]          = [];
	eventInfo[eventDir]['files'] = [];

	var eventStart = new Date();
	var eventEnd   = new Date();

	var files = fs.readdirSync(eventDir);
	if (files.indexOf('.picasa.ini') >= 0) {
		files.splice(files.indexOf('.picasa.ini'), 1);
	}
	if (files.indexOf('.picasaoriginals') >= 0) {
		files.splice(files.indexOf('.picasaoriginals'), 1);
	}

	// if the event has JPG files, let's skip video files
	// JPG files are far more reliable and accurate
	files.forEach(function(fileName) {
		var fileExt = getFileExt(fileName);
		if (fileExt && fileExt.match(Config.imageTypes)) {
			eventInfo[eventDir]['skip_videos'] = true;
		}
		if (fileExt && fileExt.match(Config.videoTypes)) {
			eventInfo[eventDir]['videos_exist'] = true;
		}
	});

	// only scan if there are new files so we're MUCH faster
	mongo.db.collection('events').findOne({
		name:  eventName,
		path:  eventDir
	},
	function (err, event) {
		var scanFiles = false;

		if ( ! event || ! event.files ) {
			scanFiles = true;
		} else if (files.length != event.files.length) {
			scanFiles = true;
		} else if (files.toString() != event.files.toString()) {
			files.forEach(function(fileName) {
				if (event.files.indexOf(fileName) == -1) {
					scanFiles = true;
				}
			});
		}

		if ( ! scanFiles ) {
			//console.log(eventName + ' has no new files.');
			return nextEvent();
		}

		async.eachLimit(files, 5,
			function iter(fileName, next) {
				var fileExt = getFileExt(fileName);
				eventInfo[eventDir]['files'].push(fileName);

				getFileDate(eventDir, fileName, function(fileDate) {
					if (fileDate === false) {
						return next();
					}

					if (fileDate < eventStart) {
						eventStart = fileDate;
						eventEnd   = eventStart;
					}

					// only set the event end date if it's a file with EXIF
					if (fileExt && fileExt.match(Config.imageTypes)) {
						if (fileDate > eventEnd) {
							eventEnd = fileDate;
						}
					}

					eventInfo[eventDir]['start'] = eventStart;
					eventInfo[eventDir]['end']   = eventEnd;

					if (fileExt) {
						genThumbnail(eventName, eventDir, fileName, function() {
							next();
						});
					} else {
						next();
					}
				});
			},
			function done(err) {
				var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
				var year       = eventStart.getFullYear();
				var month      = monthNames[ eventStart.getMonth() ];

				var eventSlug = year + '/' + month + '/';
				    eventSlug = eventSlug + eventName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

				if (eventInfo[eventDir]['files'].length == 0) {
					nextEvent();
				}

				console.log(eventName + ' (' + files.length + ' files):');
				console.log(' -> started ' + eventStart);
				console.log(' -> ended   ' + eventEnd);
				if (eventInfo[eventDir]['skip_videos'] && eventInfo[eventDir]['videos_exist']) {
					console.log(' -> (JPG found - skipped video files)');
				}

				mongo.db.collection('events').update({
					name:  eventName,
					path:  eventDir
				},
				{
					name:    eventName,
					slug:    eventSlug,
					year:    year,
					month:   month,
					begins:  eventStart,
					ends:    eventEnd,
					path:    eventDir,
					thumb:   eventInfo[eventDir]['files'][0],
					files:   eventInfo[eventDir]['files'].sort()
				},
				{
					upsert: true
				},
				function (err, event) {
					if (err) throw err;
				});

				nextEvent();
			}
		);
	});
}

function getFileDate(eventDir, fileName, callback) {
	var filePath = eventDir + slash + fileName;
	var fileExt  = getFileExt(fileName);
	var fileDate = false;

	// JPG files - always prefer EXIF metadata
	if (fileExt && fileExt.match(Config.imageTypes)) {
		getImageExifDate(filePath, function(fileDate) {
			callback(fileDate);
		});
	}

	// Video files - always prefer XMP metadata
	else if (fileExt && fileExt.match(Config.videoTypes)) {
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

function genThumbnail(eventName, eventDir, fileName, callback) {
	var filePath = eventDir + slash + fileName;
	var fileExt  = getFileExt(fileName);

	var thumbCmd = Config.cli.convert;
	if (fileExt.match(Config.videoTypes)) {
		thumbCmd = Config.cli.ffmpeg;
	}

	async.eachLimit(Config.thumbs.sizes, 5,
		function iter(size, next) {
			var thumbPath    = Config.thumbs.path + slash + eventName;
			var thumbFile    = thumbPath + slash + fileName + '-' + size + '.' + fileExt;
			var dimensions   = size.split('x');
			var options      = [];
			var genThumbFile = false;

			// video thumbnails (square only)
			if (fileExt.match(Config.videoTypes)) {
				if (size.match(/x/)) {
					genThumbFile = true;
					var topPadPx = dimensions[0] / 4;
					thumbFile    = thumbFile + '.jpg';
					var options = [
						'-y',
						'-vf', 'scale=' + dimensions[0] + ':trunc(ow/a/2)*2,pad=' + dimensions[0] + ':' + dimensions[1] + ':0:' + parseInt(topPadPx) + ':black',
						'-i', filePath,
						thumbFile
					];
				}
			}
			// photo thumbnails (square and large with no cropping)
			else {
				if (size.match(/x/)) {
					if (fileExt.match(Config.imageTypes)) {
						genThumbFile = true;
						var options = [
							'-gravity', 'center',
							'-thumbnail', size + '^',
							'-extent', size,
							'-auto-orient',
							filePath,
							thumbFile
						];
					}
				}
				else {
					genThumbFile = true;
					var options = [
						'-thumbnail', size,
						'-auto-orient',
						filePath,
						thumbFile
					];
				}
			}

			if (genThumbFile) {
				mkdirp(thumbPath, function(err) {
					if (err) throw err;

					if ( ! fs.existsSync(thumbFile) ) {
						child_process.execFile(thumbCmd, options, {}, function(err, stdout) {
							//if (err) throw err;
							next();
						});
					} else {
						next();
					}
				});
			} else {
				next();
			}
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
		return x[1].toLowerCase();
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
