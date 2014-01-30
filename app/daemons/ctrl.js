var Config       = require('../config');
var process_name = process.argv[2];

if (process_name.match(/\.js$/)) {
	process_name = process_name.replace(/\.js$/, '');
}

var daemon = require('daemonize2').setup({
	main: Config.daemons.root + process_name + '.js',
	name: process_name,
	pidfile: '/tmp/' + Config.brand.name_lc + '_' + process_name + '.pid'
});

switch (process.argv[3]) {
	case 'start':
		daemon.start();
	break;

	case 'stop':
		daemon.stop();
	break;

	case "kill":
		daemon.kill();
	break;

	case "restart":
		daemon.stop(function(err) {
			daemon.start();
		});
	break;

	case "reload":
		console.log("Reload.");
		daemon.sendSignal("SIGUSR1");
	break;

	case "status":
		var pid = daemon.status();
		if (pid) {
			console.log("Daemon running. PID: " + pid);
		} else {
			console.log("Daemon is not running.");
		}
	break;

	default:
		console.log('Usage: node ' + process.argv[1] + ' ' + process_name + ' [start|stop|kill|restart|reload|status]');
}
