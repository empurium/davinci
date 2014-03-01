var express = require('express');
var app     = express();
var server  = require('http').createServer(app);
var swig    = require('swig');
var cons    = require('consolidate');

var Config  = require('./app/config');
var routes  = require('./routes');
var mongo   = require('./app/db/mongo');

app
	// these are in place of bodyParser(), but we
	// don't need file uploads right now so let's be secure
	.use(express.json())
	.use(express.urlencoded())

	.use(express.cookieParser(Config.cookie_secret))
	.use(express.cookieSession({secret: Config.session_secret }))
	.enable('trust proxy')
	.engine('.html', cons.swig)
	.set('view engine', 'html')
	.set('views', __dirname + '/views');

swig.init({
	root: __dirname + '/views',
	cache: false,
	allowErrors: true
});

app.get('/', routes.root.root);
//app.get('/login', routes.root.root);
//app.post('/login', routes.user.login);
//app.get('/logout', routes.user.logout);

app.get('/events/search/:search', routes.events.search);
app.get('/events/recent', routes.events.recent);
app.get('/events/loadsince', routes.events.loadsince);
app.get('/:year/:month/:slug', routes.events.event);

app.get('/thumb/:year/:month/:slug/:image', routes.images.thumb);
app.get('/view/:year/:month/:slug/:image', routes.images.view);
app.get('/view/full/:year/:month/:slug/:image', routes.images.view);


server.listen(Config.port, Config.host);
console.log('DaVinci ready on port ' + Config.port + ' at ' + Config.host);
