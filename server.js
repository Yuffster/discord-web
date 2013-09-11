var net     = require('net'),
    sys     = require('sys'),
    fs      = require('fs'),
    http    = require('http'),
    express = require('express'),
    app     = express(),
    moo     = require('mootools-express'),
    server  = http.createServer(app);

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
  
  var io = require('socket.io').listen(server);
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
      server.listen(port);
      sys.puts("Webserver listening on port "+port);
    }
  }
  
};
