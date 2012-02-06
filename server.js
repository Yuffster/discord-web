var net     = require('net'),
    sys     = require('sys'),
    fs      = require('fs'),
    express = require('express'),
    app     = express.createServer(),
    moo     = require('mootools-express');

exports.start = function(config) {

	app.use(express.static(config.world_path + '/public'));
	app.use(express.static(__dirname + '/public'));

	app.set('views', (config.views || __dirname+'/views'));
	app.set('view engine', (config.view_engine || 'ejs' ));

	moo.listen(app, '/scripts/mootools.js')

	app.get('/', function(res, req) {
		req.render('index', {world_name:config.world_name});
	});

	var io = require('socket.io').listen(app);
	io.sockets.on('connection', function (socket) {
		var conn = net.createConnection(config.world_port);
		conn.setEncoding('utf-8');
		conn.on("data", function(data) {
			socket.emit('data', data);
		});
		socket.on("data", function(data) {
			conn.write(data);
		});
    socket.on("disconnect", function(data) {
      console.log("OMG DISCONNECT BUYBYE");
      conn.end();
    });
	});
	
	return app;
	
};
