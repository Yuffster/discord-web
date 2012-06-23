var net     = require('net'),
    util = require('util'),
    fs      = require('fs'),
    express = require('express'),
    app     = express.createServer(),
    moo     = require('mootools-express');

exports.start = function(config) {

	var path = require('path').normalize(config.static_path || config.world_path + "/../public");
	app.use(express.static(config.static_path || config.world_path + "/../public"));
	app.use(express.static(__dirname + '/public'));

	app.set('views', (config.views || __dirname+'/views'));
	app.set('view engine', (config.view_engine || 'ejs' ));

	moo.listen(app, '/scripts/mootools.js')

	app.get('/', function(res, req) {
		req.render('index', {world_name:config.world_name});
	});
	
	var io = require('socket.io').listen(app, { log: false });
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
		
	return {
		listen: function(port) {
			app.listen(port);
			util.puts("Webserver listening on port "+port);
		}
	}
	
};
