const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	socketio = require('socket.io'),
	mongoose = require('mongoose');

const mongooseConfig = {
	useNewUrlParser: true
};

var mongoDBPort = process.env.MONGODB_URI || 'mongodb://localhost:27017/basicComms';

mongoose.connect(mongoDBPort, mongooseConfig);
mongoose.set('useFindAndModify', false);

//mongoose set up
var Schema = mongoose.Schema;

var sampleCommunication = {
	user: String,
	event: String,
	currentColor: String,
	dateString: String,
	randomizedDelay: String
};

var log = new Schema({
	name: String,
	identifier: String,
	messages: [ sampleCommunication ],
	debrief: [ String ]
});

var Log = mongoose.model('Log', log);

//config

var port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

//Routes

app.get('/', (req, res) => {
	res.render('index');
	// timerUntilOver(res);
});

app.get('/survey', (req, res) => {
	res.render('survey');
});

app.post('/survey', (req, res) => {
	console.log(req.body);
	var debriefInput = [ req.body.Comms1, req.body.Comms2, req.body.Comms3 ];
	Log.findOneAndUpdate(
		{ identifier: req.body.identifier },
		{
			$set: { debrief: debriefInput }
		},
		{ new: true },
		(err, result) => {
			// Rest of the action goes here
			if (err) {
				console.log('Error!', err);
			}
		}
	);
	res.send('Thanks! You can close this tab now');
});

//Start Server
var server = app.listen(port, () => {
	console.log('Server started on port ' + port);
});

var sessionColorStorer = [
	{
		id: 'sampleID',
		currentColor: 'sampleColor'
	}
];

function getColor(id) {
	var output = null;
	sessionColorStorer.forEach((element) => {
		if (element.id === id) {
			output = element.currentColor;
		}
	});
	return output;
}

function addID(idInput, currentColorInput) {
	sessionColorStorer.push({
		id: idInput,
		currentColor: currentColorInput
	});
}
function updateColor(id, currentColor) {
	sessionColorStorer.forEach((element) => {
		if (element.id == id) {
			element.currentColor = currentColor;
		}
	});
}

// attach Socket.io to our HTTP server
var io = socketio.listen(server);
// handle incoming connections from clients
io.sockets.on('connection', function(socket) {
	// once a client has connected, we expect to get a ping from them saying what room they want to join
	console.log('****************');
	console.log('New incoming connection');
	console.log('****************');

	var currID = null,
		currUser = null;

	socket.on('room', function(room) {
		console.log('Room join request on: ' + room.id);
		currUser = room.user;
		currID = room.id;

		addID(currID, 'black');

		Log.create({ name: currUser, identifier: currID, messages: [] });

		socket.join(room.id, () => {
			console.log(
				'Server says: ' + 'Welcome, ' + room.user + '! You succesfully joined room with the id ' + room.id
			);
			var welcome = {
				user: 'Server',
				event: 'Hallo! You are succefully connected to the room with the id ' + room.id,
				time: new Date().toISOString()
			};
			io.to(room.id).emit('message', welcome);
		});
	});

	socket.on('message', (data) => {
		console.table(data);
		Log.findOneAndUpdate(
			{ identifier: currID },
			{
				$push: {
					messages: {
						user: data.user,
						event: data.event,
						currentColor: data.currentColor,
						dateString: data.time,
						randomizedDelay: data.randomizedDelay
					}
				}
			},
			{ new: true },
			(err, result) => {
				// Rest of the action goes here
				if (err) {
					console.log('Error!', err);
				}
			}
		);
		serverResponse(currID);
	});

	socket.on('disconnect', (dis) => {
		console.log('****************');
		console.log(currUser + ' has left the room with id ' + currID + ' at ' + new Date().toISOString());
		console.log('****************');
	});
});

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function serverResponse(currID) {
	var randomTime = getRandomInt(2000, 5000);
	await sleep(randomTime);

	var dataPacket = {
		user: 'Server',
		event: null,
		currentColor: getColor(currID),
		time: new Date().toISOString(),
		randomizedDelay: randomTime + 'ms'
	};

	if (dataPacket.currentColor == 'white') {
		dataPacket.event = 'white to black';
		dataPacket.currentColor = 'black';
	} else {
		dataPacket.event = 'black to white';
		dataPacket.currentColor = 'white';
	}

	updateColor(currID, dataPacket.currentColor);

	Log.findOneAndUpdate(
		{ identifier: currID },
		{
			$push: {
				messages: {
					user: dataPacket.user,
					event: dataPacket.event,
					currentColor: dataPacket.currentColor,
					dateString: dataPacket.time,
					randomizedDelay: dataPacket.randomizedDelay
				}
			}
		},
		{ new: true },
		(err, result) => {
			// Rest of the action goes here
			if (err) {
				console.log('Error!', err);
			}
		}
	);
	io.emit('message', dataPacket);

	console.table(dataPacket);
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
