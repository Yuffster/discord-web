var net     = require('net'),
    sys     = require('sys'),
    fs      = require('fs'),
    express = require('express'),
    app     = express.createServer(),
    moo     = require('mootools-express');

/**
 * Parse the config file to figure out the port and world directory 
 * location.
 */
var config_file = process.argv[2];
if (!config_file) {
	sys.puts("Config file is required. See config.example.json for more info.");
	sys.puts("Usage: node ./server.js <config file>");
	process.exit();
}

try {
	config = fs.readFileSync(config_file);
} catch (err) {
	sys.puts(err);
	process.exit();
} 

CONFIG = {};
eval("CONFIG ="+config);

if (!CONFIG) {
	sys.puts("Could not decode config file.  Please ensure that the file is in "+
	         "valid JSON format.");
	process.exit();
}

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.listen(CONFIG.web_port);
moo.listen(app, '/scripts/mootools.js')

app.get('/', function(res, req) {
	req.render('index', {game_title:CONFIG.world_name});
});

var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket) {
	var conn = net.createConnection(CONFIG.game_port);
	conn.setEncoding('utf-8');
	conn.on("data", function(data) {
		socket.emit('data', data);
	});
	socket.on("data", function(data) {
		conn.write(data);
	});
});