const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	socketio = require('socket.io'),
	mongoose = require('mongoose');
	// env = require('node-env-file');


	

// env(__dirname + '/.env');

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
	delay: String
};

var log = new Schema({
	name: String,
	identifier: String,
	messages: [ sampleCommunication ],
	debrief: [ String ]
});

var Log = mongoose.model('Log', log);

var dashboard = new Schema({
	serverSideCheckingFreq: Number,
	totalExperimentLength: Number,
	clientSideDelayBeforeProcessing: Number,
	clientSideCheckingFrequency: Number

});

var Dashboard = mongoose.model('Dashboard', dashboard);

var serverSideCheckingFreq;
var totalExperimentLength;
var clientSideDelayBeforeProcessing;
var clientSideCheckingFrequency;

function checkProgramVariableStatus() {
	Dashboard.find({ serverSideCheckingFreq: { $gte: 0 }}, function (err, docs) {
		if(err) {
			console.error("error: ", err);
		}
		console.log("mongoose query is: " + docs + "\n length is :" + docs.length);
		if(docs.length === 0) {
			var programVariables = new Dashboard({
				serverSideCheckingFreq: 2000,
				totalExperimentLength: 180000,
				clientSideDelayBeforeProcessing: 5000,
				clientSideCheckingFrequency: 1000
			})

			serverSideCheckingFreq = 2000;
			totalExperimentLength = 180000;
			clientSideDelayBeforeProcessing = 5000;
			clientSideCheckingFrequency = 1000;
			
			programVariables.save( (err, docsIn) => {
				if (err) {
					console.log("error!", err);
				}

				console.log("The just saved values are "  + docsIn);
			})
			console.log("Variables have now been set");
		} else {
			console.log("variables have already been instantiated");
			serverSideCheckingFreq = docs[0].serverSideCheckingFreq;
			totalExperimentLength = docs[0].totalExperimentLength
			clientSideDelayBeforeProcessing = docs[0].clientSideDelayBeforeProcessing
			clientSideCheckingFrequency = docs[0].clientSideCheckingFrequency
		}
	});
}

checkProgramVariableStatus();




//config

var port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

//Routes

app.get('/', (req, res) => {
	res.render('login');
});

app.get('/communication', (req, res) => {
	res.render('index');
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
	res.render('final');
});
app.get('/dashboardLogin', (req, res) => {
	res.render('dashboardLogin');
})

app.post('/dashboardLogin', authentication, (req, res) => {	
	res.render('dashboard')
})

app.post('/dashboard', (req, res) => {
	var progVars = [ 
		req.body.serverSideCheckingFreq,
		req.body.totalExperimentLength,
		req.body.clientSideDelayBeforeProcessing,
		req.body.clientSideCheckingFrequency
	 ];

	adminUpdateOfVars(progVars);
	res.send("Thank you! Vars have been updated");
});

async function adminUpdateOfVars(progVars) {
	if (progVars[0].length === 0) {
		progVars[0] = serverSideCheckingFreq;
	} else {
		serverSideCheckingFreq = parseInt(progVars[0], 10);
	}
	if (progVars[1].length === 0) {
		progVars[1] = totalExperimentLength;
	} else {
		totalExperimentLength = parseInt(progVars[1], 10);
	}
	if (progVars[2].length === 0) {
		progVars[2] = clientSideDelayBeforeProcessing;
	} else {
		clientSideDelayBeforeProcessing = parseInt(progVars[2], 10);
	}
	if (progVars[3].length === 0) {
		progVars[3] = clientSideCheckingFrequency;
	} else {
		clientSideCheckingFrequency = parseInt(progVars[3], 10);
	}



	const filter = { serverSideCheckingFreq: { $gte: 0 }};
	const update = { 
		serverSideCheckingFreq: progVars[0],
		totalExperimentLength: progVars[1],
		clientSideDelayBeforeProcessing: progVars[2],
		clientSideCheckingFrequency: progVars[3]
	};

	// `doc` is the document _after_ `update` was applied because of`new: true`
	let doc = await Dashboard.findOneAndUpdate(filter, update, { new: true});
	console.log("Admin has updated values");
	console.log(
		"Values are: ", 
		doc.serverSideCheckingFreq, 
		doc.totalExperimentLength, 
		doc.clientSideDelayBeforeProcessing, 
		doc.clientSideCheckingFrequency)
}

function authentication(req, res, next){
	//validate username and password
	var isValid = check(req.body.username, req.body.password); //your validation function
	if(isValid){
	 next(); // valid password username combination
	 } else {
		res.redirect('/dashboardLogin'); //Unauthorized
	 }    
}

function check(username, password) {
	console.log(process.env.USERNAME , username);
	console.log(process.env.PASSWORD , password);
	return (process.env.USERNAME === username && process.env.PASSWORD === password);
}
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

var buffer = [
	{
		id: 'sampleID',
		bufferArray: [ 'sampleMessage' ]
	}
];

var intervalIDArray = [
	{
		id: 'sampleID',
		intervalID: 'sampleID'
	}
];

function startNewInterval(currID) {
	let temp = setInterval(() => {
		checkBuffer(currID);
	}, serverSideCheckingFreq);
	intervalIDArray.push({
		id: currID,
		intervalID: temp
	});
}

function getIntervalID(id) {
	var returnableID;
	intervalIDArray.forEach((el) => {
		if (el.id == id) {
			returnableID = el.intervalID;
		}
	});
	return returnableID;
}

function updateIntervalID(id) {
	intervalIDArray.forEach((el) => {
		if (el.id == id) {
			el.intervalID = setInterval(() => {
				checkBuffer(id);
			}, serverSideCheckingFreq);
		}
	});
}

function createBuffer(currID) {
	buffer.push({
		id: currID,
		bufferArray: []
	});
}

function addToBuffer(id, message) {
	buffer.forEach((el) => {
		if (el.id == id) {
			el.bufferArray.push(message);
		}
	});
}

function getHeadFromBuffer(id) {
	var firstEl;
	buffer.forEach((el) => {
		if (el.id == id) {
			firstEl = el.buffer.shift();
		}
	});
	return firstEl;
}

function getBuffer(idInput) {
	var returnJourney;
	buffer.forEach((el) => {
		if (el.id == idInput) {
			returnJourney = el.bufferArray;
		}
	});
	return returnJourney;
}

function printAllBuffersWithSize() {
	buffer.forEach((el) => {
		console.log(`Buffer of ${el.id} has size ${el.bufferArray.length}`);
	});
}
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
		createBuffer(currID);
		startNewInterval(currID);

		Log.create({ name: currUser, identifier: currID, messages: [] });

		socket.join(room.id, () => {
			console.log(
				'Server says: ' + 'Welcome, ' + room.user + '! You succesfully joined room with the id ' + room.id
			);

			var startUpVars = {
				experimentLength: totalExperimentLength,
				delayBeforeProcessing: clientSideDelayBeforeProcessing,
				checkingFrequency: clientSideCheckingFrequency
			}

			io.to(room.id).emit('startUp', startUpVars);

			var welcome = {
				user: 'Server',
				event: 'Hallo! You are succefully connected to the room with the id ' + room.id,
				time: new Date().toISOString(),
			};
			io.to(room.id).emit('message', welcome);
			io.to(room.id).emit('keep-alive', currID);
		});
	});

	socket.on('message', (dataList) => {
		dataList.forEach((element) => {
			console.log(`Adding message from ${element.user} at ${element.time}`);
			element.id = currID;
			console.table(element);
			addToBuffer(element.id, element);
			let data = element;
			Log.findOneAndUpdate(
				{ identifier: currID },
				{
					$push: {
						messages: {
							user: data.user,
							event: data.event,
							currentColor: data.currentColor,
							dateString: data.time,
							delay: data.delay
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
		});

		// serverResponse(currID);
	});

	socket.on('disconnect', (dis) => {
		console.log('****************');
		console.log(currUser + ' has left the room with id ' + currID + ' at ' + new Date().toISOString());
		console.log('****************');
		socket.disconnect();
	});

	socket.on('keep-alive', (currID) => {
		io.to(currID).emit('keep-alive', currID);
		console.log(`Keeping ${currID} alive right now`);
	})
});

function checkBuffer(id) {
	var bufferArray1 = getBuffer(id);
	if (bufferArray1.length == 0) {
		// console.log(`Set Interval was just triggered at ${new Date()} and buffer is empty`);
	} else {
		clearInterval(getIntervalID(id)); //pause interval at every 2s
		processHead(id);
	}
}

async function processHead(id) {
	let specificBuffer = getBuffer(id);
	if (specificBuffer.length > 0) {
		let currentElement = specificBuffer.shift();
		let preSleepTail = specificBuffer[specificBuffer.length - 1];
		console.log(`Sleeping for ${currentElement.delay + 'ms'}`);
		let timeBeforeSleep = new Date().getTime();
		await sleep(currentElement.delay);
		let timeAfterSleep = new Date().getTime();
		console.log(
			`Sleep is done for ${timeAfterSleep -
				timeBeforeSleep} ms. Sleep was supposed to be done for ${currentElement.delay} ms`
		);
		if (preSleepTail == specificBuffer[specificBuffer.length - 1]) {
			updateAndSend(currentElement);
		} else {
			modifyBuffer(specificBuffer, preSleepTail, id);
		}
		processHead(id);
	} else {
		updateIntervalID(id); //restart interval
	}
}

function updateAndSend(currentElement) {
	var dataPacket = {
		user: 'Server',
		event: null,
		currentColor: getColor(currentElement.id),
		time: new Date().toISOString(),
		delay: currentElement.delay + 'ms'
	};

	if (dataPacket.currentColor == 'white') {
		dataPacket.event = 'white to black';
		dataPacket.currentColor = 'black';
	} else {
		dataPacket.event = 'black to white';
		dataPacket.currentColor = 'white';
	}

	updateColor(currentElement.id, dataPacket.currentColor);

	Log.findOneAndUpdate(
		{ identifier: currentElement.id },
		{
			$push: {
				messages: {
					user: dataPacket.user,
					event: dataPacket.event,
					currentColor: dataPacket.currentColor,
					dateString: dataPacket.time,
					delay: dataPacket.delay
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
	// io.emit('message', dataPacket);
	io.to(currentElement.id).emit('message', dataPacket);

	console.table(dataPacket);
}

function printEmergency(num) {
	var count = num;
	while (count > 0) {
		console.log(
			'#####################################################################################################################################'
		);
		count--;
	}
}
function modifyBuffer(bufferSpec, preSleepTail, id) {
	printEmergency(5);
	console.log('Interupption in buffer of ' + id);
	currel = bufferSpec[0];
	console.log('comparison: ', bufferSpec, getBuffer(id));
	while (currel != preSleepTail) {
		currel = bufferSpec.shift();
	}
	bufferSpec.shift();
	console.log(`Buffer of ${id} is ${bufferSpec}`);
	printAllBuffersWithSize();
	printEmergency(5);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
