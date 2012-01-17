require('discord').start({
	world_name: 'DiscordMUD',
	world_path: __dirname+'/world',
	start_room: 'lobby'
}).listen(8000);

require('./server').start({
	"world_name"  : "DiscordMUD",
	"game_port"   : 8000
}).listen(8080);