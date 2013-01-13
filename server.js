var net      = require('net'),
    sys      = require('util'),
    fs       = require('fs'),
    express  = require('express'),
    partials = require('express-partials'), 
    app      = express(),
    moo      = require('mootools-express');

exports.start = function(config) {

	var path = require('path').normalize(config.static_path || config.world_path + "/../public");
	app.use(express.static(config.static_path || config.world_path + "/../public"));
	app.use(express.static(__dirname + '/public'));
	app.use(partials());

	config.world_port = config.world_port || 8000;

	app.set('views', (config.views || __dirname+'/views'));
	app.set('view engine', (config.view_engine || 'ejs' ));
	app.set('view options', { layout: '/views/layout.html' });

	moo.listen(app, '/scripts/mootools.js')

	app.get('/', function(res, req) {
		req.render('index', {world_name:config.world_name});
	});

	return {

		listen: function(port) {

			var http = require('http').createServer(app);
			http.listen(port);
			sys.puts("Webserver listening on port "+port);

			var io = require('socket.io').listen(http);
			io.set('log level', 1);
			io.sockets.on('connection', function (socket) {
				var conn = net.createConnection(config.world_port);
				conn.setEncoding('utf-8');
				conn.on("data", function(data) {
					socket.emit('data', data);
				});
				socket.on("data", function(data) {
					conn.write(data);
				});
			});

			sys.puts("Socket is listening to "+config.world_port);


		}
	}
	
};
