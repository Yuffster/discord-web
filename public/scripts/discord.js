(function() { //Only Discord will end up in the global namespace.

Discord = new Class({

	Implements: [Events, Options],
	
	connection: false,
	commandHistory: [],
	commandIndex: 0,
	
	map: false,
	
	nextClass: '',
		
	options: {
		//Server-side escape pattern for JSON data.  The capture group will be
		//parsed as a JSON object.
		escapePattern: /^<!-- \n(.*)\n-->$/g,
		//IDs for the various UI elements.
		ui: {
			'map': 'map',
			'console': 'console',
			'commandLine': 'commandLine'
		},
		macros: {
			w: 'north',
			s: 'south',
			a: 'west',
			d: 'east',
			q: 'up',
			e: 'down'
		}
	},
	
	initialize: function(options) {
		this.setOptions(options);
		this.attachEvents();
		this.connection = io.connect('http://localhost');
		this.connection.emit("data", ">>> GUI_ON <<<");
		this.connection.on('data', this.handleData.bind(this));
		this.connection.on('ansi', this.handleANSI.bind(this));
	},
	
	attachEvents: function() {
		var my = this;
		this.getUI('commandLine').addEvent('keydown', function(e) {
			if (e.key=='enter') {
				e.stop();
				var command = this.value;
				my.sendCommand(command);
				my.commandHistory.push(command);
				this.value = '';
			}
		});
		window.addEvent('keydown', function(e) {
			if (['input', 'textarea'].contains(e.target.get('tag'))) { return; }
			if (my.options.macros[e.key]) {
				e.stop();
				my.sendCommand(my.options.macros[e.key]);
			}
		});
	},
	
	sendCommand: function(line) {
		this.connection.emit('data', line);
	},

	handleData: function(data) {
		data = data.trim();
		var patt = this.options.escapePattern;
		if (data.match(patt)) {
			//Decode the JSON data, send the obj.data to the handler specified
			//by obj.handler.  If no handler is specified, or the specified
			//handler method doesn't exist, nothing will happen.
			var json = data.replace(patt, '$1');
			var obj = JSON.decode(json);
			if (!obj['handler']) { return; }
			var handlerMeth = obj.handler+'Handler';
			if (!this[handlerMeth]) { console.error("No handler found for "+handlerMeth+"."); return; }
			this[handlerMeth](obj.data);
		} else {
			this.consoleOutput(data);
		}
	},
	
	activeANSI: [],
	resetLine: false,
	
	handleANSI: function(code) {
		if (code==0 || code==39) { //Reset.
			this.resetLine = true;
		} else if (!this.activeANSI.contains(code)){
			this.activeANSI.push(code);
		}
	},
	
	getUI: function(name) {
		return $(this.options.ui[name]);
	},

	consoleOutput: function(data) {
		var classes = [this.nextClass];
		this.activeANSI.reverse().each(function(code) { classes.push('ansi-'+code); }, this);
		if (this.resetLine) { this.activeANSI = []; this.resetLine = false; }
		this.getUI('console').adopt(new Element('div', {text:data, 'class':classes.join(' ')}));
		this.getUI('console').scrollTo(0, this.getUI('console').getScrollSize().y);
		this.nextClass = '';
	},
	
	/**
	 * A special data object will tell us what the style of the next line should
	 * be.  We'll remember it here and use it in consoleOutput to add a class to
	 * the next div injected.
	 */
	styleHandler: function(style) {
		this.nextClass = style;
	},
	
	/**
	 * Takes the player data from the prompt and places it on a GUI
	 * status area.
	 */
	statusHandler: function(data) {
		
	},
	
	/**
	 * Turns a JSON array of room data to a GUI map.
	 */
	mapHandler: function(rooms) {
		this.map = new Map(rooms).outputMap(this.getUI('map'));
	}
	
});

var Map = new Class({
	
	map: {},
	
	rooms: {},
	
	initialize: function(rooms) {
		this.rooms = rooms;
		this.normalizePoints();
	},
	
	normalizePoints: function() {
		
		var low_x, low_y, high_x, high_y, offset;
		
		//Calculate the lowest points.
		this.rooms.each(function(room) {
			if (low_x  == null || room.coords[0] < low_x)  { low_x  = room.coords[0]; }
			if (low_y  == null || room.coords[1] < low_y)  { low_y  = room.coords[1]; }
			if (high_x == null || room.coords[0] > high_x) { high_x = room.coords[0]; }	
			if (high_y == null || room.coords[1] > high_y) { high_y = room.coords[1]; }		
		});
		
		//Use the lowest points to determine an offset.
		offset = [(low_x*-1)+1, (low_y*-1)+1];
		
		//Apply the offset to all points then add to the map.
		this.rooms.each(function(room) {
			var x,y;
			x = room.coords[0] = room.coords[0] + offset[0];
			y = room.coords[1] = room.coords[1] + offset[1];
			if (!this.map[x]) { this.map[x] = {}; }
			this.map[x][y] = room.room;
		}, this);
		
		this.height = high_y + offset[1];
		this.width  = high_x + offset[0];
		
		return this.map;
		
	},
	
	getRoom: function(x,y) {
		if (!this.map[x]) { return false; }
		return this.map[x][y] || false;
	}, 
	
	outputMap: function(parent) {
		var table  = new Element('table');
		var length = this.map.length;
		var x, y, room, td, classes, exitClass, table, tr, td,
		    dirs = ['north', 'south', 'east', 'west', 'up', 'down'];
		table = new Element('table');
		for (y = 1; y<= this.height; y++) {
			tr = new Element('tr');
			var rx = false, ry= false;
			for (x=1; x<=this.width;x++) {
				room = this.getRoom(x,y);
				if (room) {
					rx = room.coords[0];
					ry = room.coords[1];
					classes = [];
					dirs.each(function(d) {
						if (!room.exits[d]) { exitClass='wall'; }
						else { exitClass = room.exits[d].type; }
						exitClass += '-'+d.charAt(0);
						classes.push(exitClass);
					});
					classes = classes.join(' ');
				} else {
					classes = 'empty';
				}
				if (room.current) { classes += " current"; }
				td = new Element('td')
				     .adopt(new Element('div', {'class':'tile '+classes, 'title':room.short+' ['+rx+','+ry+']', 'text':' '}));
				tr.adopt(td);
			}
			table.adopt(tr);
		} parent.empty().adopt(table);
	}
	
});

})();