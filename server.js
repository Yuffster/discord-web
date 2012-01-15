var net     = require('net'),
    fs      = require('fs'),
    express = require('express'),
    app     = express.createServer(),
	moo     = require('mootools-express');

var WEB_PORT = 8080,
    MUD_PORT = 8000;

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.listen(WEB_PORT);
moo.listen(app, '/scripts/mootools.js')

app.get('/', function(res, req) {
	req.render('index');
});

var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket) {
	var conn = net.createConnection(MUD_PORT);
	conn.setEncoding('utf-8');
	conn.on("data", function(data) {
		socket.emit('data', data);
	});
	socket.on("data", function(data) {
		conn.write(data);
	});
});