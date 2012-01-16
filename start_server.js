require('discord').start({
	name: 'DiscordMUD',
	world_path: 'example_world',
	start_room: 'lobby'
}).listen(8000);

require('./server').start({
	"world_name"  : "DiscordMUD",
	"game_port"   : 8000
}).listen(8080);