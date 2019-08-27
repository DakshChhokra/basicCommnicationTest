const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	socketio = require('socket.io'),
	mongoose = require('mongoose');
//Uncomment the following line to run this on local
// env = require('node-env-file');

//Uncomment the following line to run this on local
// env(__dirname + '/.env');

//Add USERNAME, PASSWORD and MONGODB URI vars to your local .env file and use process.env to call it

//mongoose set up
const mongooseConfig = {
	useNewUrlParser: true
};

var mongoDBPort = process.env.MONGODB_URI || 'mongodb://localhost:27017/basicComms';

mongoose.connect(mongoDBPort, mongooseConfig);
mongoose.set('useFindAndModify', false);

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

//These are the variables which the experiment runner can change. When the server is started this variables pull their values from the database.

var serverSideCheckingFreq;
var totalExperimentLength;
var clientSideDelayBeforeProcessing;
var clientSideCheckingFrequency;

/**
	Queries the database for the value of 4 program variables. If the record doesn't exist this method creates the document with default values.
	If record exists it simply pulls the values and updates the local values. 
 */
function checkProgramVariableStatus() {
	Dashboard.find({ serverSideCheckingFreq: { $gte: 0 } }, function(err, docs) {
		if (err) {
			console.error('error: ', err);
		}
		console.log('mongoose query is: ' + docs + '\n length is :' + docs.length);
		if (docs.length === 0) {
			var programVariables = new Dashboard({
				serverSideCheckingFreq: 2000,
				totalExperimentLength: 180000,
				clientSideDelayBeforeProcessing: 5000,
				clientSideCheckingFrequency: 1000
			});

			serverSideCheckingFreq = 2000;
			totalExperimentLength = 180000;
			clientSideDelayBeforeProcessing = 5000;
			clientSideCheckingFrequency = 1000;

			programVariables.save((err, docsIn) => {
				if (err) {
					console.log('error!', err);
				}

				console.log('The just saved values are ' + docsIn);
			});
			console.log('Variables have now been set');
		} else {
			console.log('variables have already been instantiated');
			serverSideCheckingFreq = docs[0].serverSideCheckingFreq;
			totalExperimentLength = docs[0].totalExperimentLength;
			clientSideDelayBeforeProcessing = docs[0].clientSideDelayBeforeProcessing;
			clientSideCheckingFrequency = docs[0].clientSideCheckingFrequency;
		}
	});
}

checkProgramVariableStatus();

//Express config

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
});

app.post('/dashboardLogin', authentication, (req, res) => {
	res.render('dashboard');
});

app.post('/dashboard', (req, res) => {
	var progVars = [
		req.body.serverSideCheckingFreq,
		req.body.totalExperimentLength,
		req.body.clientSideDelayBeforeProcessing,
		req.body.clientSideCheckingFrequency
	];

	adminUpdateOfVars(progVars);
	res.send('Thank you! Vars have been updated');
});

/**
	This method checks if the admin wants to update all variables or just a select few.
	Then it simply update these values in the MongoDB database and then refreshes the values of the local copies of those variables.
 */
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

	const filter = { serverSideCheckingFreq: { $gte: 0 } };
	const update = {
		serverSideCheckingFreq: progVars[0],
		totalExperimentLength: progVars[1],
		clientSideDelayBeforeProcessing: progVars[2],
		clientSideCheckingFrequency: progVars[3]
	};

	// `doc` is the document _after_ `update` was applied because of`new: true`
	let doc = await Dashboard.findOneAndUpdate(filter, update, { new: true });
	console.log('Admin has updated values');
	console.log(
		'Values are: ',
		doc.serverSideCheckingFreq,
		doc.totalExperimentLength,
		doc.clientSideDelayBeforeProcessing,
		doc.clientSideCheckingFrequency
	);
}

/**
	Middleware for the password-protected dashboard page
 */
function authentication(req, res, next) {
	//validate username and password
	var isValid = check(req.body.username, req.body.password); //your validation function
	if (isValid) {
		next(); // valid password username combination
	} else {
		res.redirect('/dashboardLogin'); //Unauthorized
	}
}

/**
	Authenticates the login information presented on the Dashboard Login page. It queries the .env file on the local copy and secret variables 
	in the hosted version for the correct username and password.
 */
function check(username, password) {
	console.log(process.env.USERNAME, username);
	console.log(process.env.PASSWORD, password);
	return process.env.USERNAME === username && process.env.PASSWORD === password;
}

//End of Express Routes

//Start Server
var server = app.listen(port, () => {
	console.log('Server started on port ' + port);
});

/**
	sessionColorStorer, buffer and intervalIDArray are 3 local dictionaries which are stored when the server is up. These are used to query some information
	about a client while they are collected. 
	
	* sessionColorStorer stores the current color at any given moment for the client's screen. 
	* buffer stores an array for every connected client identifiable by an id. The buffer contains all the recieved but yet unprocessed message from the client
	* intervalIDArray stores key value pairs where the key is the id and values is the intervalID for that particular client

 */
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
/**
	Called when the client connects. Starts an interval which checks the buffer every (var: serverSideCheckingFreq) seconds
 */
function startNewInterval(currID) {
	let temp = setInterval(() => {
		checkBuffer(currID);
	}, serverSideCheckingFreq);
	intervalIDArray.push({
		id: currID,
		intervalID: temp
	});
}

/**
	Queries the dictioanry of key value pairs with the id and return the interval id.
 */
function getIntervalID(id) {
	var returnableID;
	intervalIDArray.forEach((el) => {
		if (el.id == id) {
			returnableID = el.intervalID;
		}
	});
	return returnableID;
}

/**
	Used to restart intervals once the processing of the buffer has finished.
 */
function updateIntervalID(id) {
	intervalIDArray.forEach((el) => {
		if (el.id == id) {
			el.intervalID = setInterval(() => {
				checkBuffer(id);
			}, serverSideCheckingFreq);
		}
	});
}
/**
	Creates a new key value pair in Buffer, where the key is the id and the value is the actual buffer which is initiated as an empty array here.
 */
function createBuffer(currID) {
	buffer.push({
		id: currID,
		bufferArray: []
	});
}

/** 
	Add a new entry to the buffer attached to the given ID.
 */
function addToBuffer(id, message) {
	buffer.forEach((el) => {
		if (el.id == id) {
			el.bufferArray.push(message);
		}
	});
}

/**
	Get the first element of buffer given an id.
 */
function getHeadFromBuffer(id) {
	var firstEl;
	buffer.forEach((el) => {
		if (el.id == id) {
			firstEl = el.buffer.shift();
		}
	});
	return firstEl;
}

/**
	Get the buffer array from the buffer dictionary given a particular ID.
 */
function getBuffer(idInput) {
	var returnJourney;
	buffer.forEach((el) => {
		if (el.id == idInput) {
			returnJourney = el.bufferArray;
		}
	});
	return returnJourney;
}

/**
	Print the size of all the buffers along with the ID associated with them. Used for logging/debugging.
 */
function printAllBuffersWithSize() {
	buffer.forEach((el) => {
		console.log(`Buffer of ${el.id} has size ${el.bufferArray.length}`);
	});
}
/**
	Get the current color from a client given an ID. Queries sessionColorStorer.
 */
function getColor(id) {
	var output = null;
	sessionColorStorer.forEach((element) => {
		if (element.id === id) {
			output = element.currentColor;
		}
	});
	return output;
}
/**
	Used to instantiate an entry in sessionColorStorer when a new Client joins.
 */
function addID(idInput, currentColorInput) {
	sessionColorStorer.push({
		id: idInput,
		currentColor: currentColorInput
	});
}
/**
	Used to update the color in sessionColorStorer when the client changes their color.
 */
function updateColor(id, currentColor) {
	sessionColorStorer.forEach((element) => {
		if (element.id == id) {
			element.currentColor = currentColor;
		}
	});
}

/**
	This method is called when a user disconnects from the server. This method deletes the key value pairs which contain the id as the key from 
	sessionColorStorer, buffer and intervalIDArray
 */
function deleteFromAllThreeStores(id) {
	for (var i = 0; i < sessionColorStorer.length; i++) {
		if (sessionColorStorer[i].id == id) {
			sessionColorStorer.splice(i, 1);
		}
	}
	for (var i = 0; i < buffer.length; i++) {
		if (buffer[i].id == id) {
			buffer.splice(i, 1);
		}
	}
	for (var i = 0; i < intervalIDArray.length; i++) {
		if (intervalIDArray[i].id == id) {
			intervalIDArray.splice(i, 1);
		}
	}
}

// attach Socket.io to our HTTP server
var io = socketio.listen(server);
// handle incoming connections from clients
io.sockets.on('connection', function(socket) {
	console.log('****************', '\n New incoming connection', '\n ****************');
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

		//housekeeping actions when a client joins
		socket.join(room.id, () => {
			console.log(
				'Server says: ' + 'Welcome, ' + room.user + '! You succesfully joined room with the id ' + room.id
			);

			var startUpVars = {
				experimentLength: totalExperimentLength,
				delayBeforeProcessing: clientSideDelayBeforeProcessing,
				checkingFrequency: clientSideCheckingFrequency
			};

			io.to(room.id).emit('startUp', startUpVars);

			var welcome = {
				user: 'Server',
				event: 'Hallo! You are succefully connected to the room with the id ' + room.id,
				time: new Date().toISOString()
			};
			io.to(room.id).emit('message', welcome);
			io.to(room.id).emit('keep-alive', currID);
		});
	});

	//Transmits events fromt the client to the server
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
					if (err) {
						console.log('Error!', err);
					}
				}
			);
		});
	});

	//Housekeeping when the client leaves the room. Stops the interval which checks the buffers and call the delete method for the 3 key-value pair dictionaries.
	socket.on('disconnect', (dis) => {
		console.log('****************');
		console.log(currUser + ' has left the room with id ' + currID + ' at ' + new Date().toISOString());
		console.log('****************');
		socket.disconnect();
		clearInterval(getIntervalID(currID));
		deleteFromAllThreeStores(currID);
	});

	//A keep alive signal sent every 10 seconds to stop Heroku from closing the session and throwing a H-12-503 error
	socket.on('keep-alive', (currID) => {
		console.log('currID', currID);
		io.to(currID).emit('keep-alive', currID);
		console.log(`Keeping ${currID} alive right now`);
	});
});

/**
	This is the method called every (var: serverSideCheckingFreq) seconds as a part of the setInterval. It checks whethe there is any data in the buffer or not.
	If there is no data the method is called again in (var: serverSideCheckingFreq) seconds.
	If there is data it sent for processing to processHead.
 */
function checkBuffer(id) {
	var bufferArray1 = getBuffer(id);
	if (bufferArray1.length == 0) {
		// console.log(`Set Interval was just triggered at ${new Date()} and buffer is empty`);
	} else {
		clearInterval(getIntervalID(id)); //pause interval at every 2s
		processHead(id);
	}
}

/**
	This is an asynchronous function which processes the entire buffer of a client. It takes the head, reads the message, composes the response, and then
	sleeps for the requisite amount of time. After waking up it checks to see if nothing has been added to the buffer while the method was sleeping. 
	If nothing has been added it recursively calls itself to further process the buffer.
	If something has been added we call modifyBuffer().
 */
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

/**
	Method called within processHead to actually compose a response to an incoming message, add it to the database and then send it to the client.
 */
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

/**
	Called if something is added to the buffer while the head of the buffer was still being processed. It deletes everything which was a part of the previous transmission
	and preserves all the new data.
 */
function modifyBuffer(bufferSpec, preSleepTail, id) {
	console.log(
		'#####################################################################################################################################'
	);
	console.log('Interupption in buffer of ' + id);
	currel = bufferSpec[0];
	// console.log('comparison: ', bufferSpec, getBuffer(id));
	while (currel != preSleepTail) {
		currel = bufferSpec.shift();
	}
	// bufferSpec.shift();
	printAllBuffersWithSize();
	console.log(
		'#####################################################################################################################################'
	);
}

/**
	Actual function which is used to stop processing. It is called within the async function so that it does not block the event loop.
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
