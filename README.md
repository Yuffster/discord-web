Discord MMO Client
========================

This is the web client for Discord, a highly expressive, object-based MMO engine written in JavaScript on top of Node.JS and MooTools.

Usage
------------------------

    require('discord-web').start({
		"world_name"  : "DiscordMUD",
		"game_port"   : 8000
	}).listen(8080);
	
Change the variables accordingly, of course.

For an example world implementation of both the engine and the web client, see http://github.com/Yuffster/discord-example.