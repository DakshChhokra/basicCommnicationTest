const body = document.querySelector('body');
const bottomRight = document.querySelector('div');
var event = null;
var user = sessionStorage.getItem('username');
var room = sessionStorage.getItem('identifier');
var currentColor = 'black';
var adversaryColor = 'white';

var listOfMessages = [];
var wrapper = {
	list: listOfMessages
};

sessionStorage.setItem('listOfMessages', JSON.stringify(wrapper));

// set-up a connection between the client and the server
var socket = io.connect();

socket.on('connect', function() {
	// Connected, let's sign-up for to receive messages for this room
	var input = { id: room, user: user };
	socket.emit('room', input);
});

socket.on('message', function(data) {
	console.log(' %c Incoming message:', 'color: orange');
	console.table(data);

	if (data.event == 'black to white') {
		body.classList.remove('black');
		body.classList.add('white');

		event = 'black to white';
		currentColor = 'white';
	} else if (data.event == 'white to black') {
		body.classList.remove('white');
		body.classList.add('black');

		event = 'white to black';
		currentColor = 'black';
	}
});

socket.on('disconnect', () => {
	console.log('User has disconnected');
});

socket.on('color-update', () => {
	socket.emit('color-update', { color: currentColor });
});

body.addEventListener('click', () => {
	if (bottomRight.classList.contains('black')) {
		bottomRight.classList.remove('black');
		bottomRight.classList.add('white');

		// bottomRight.classList.remove('white');
		// bottomRight.classList.add('black');
		event = 'black to white';
		adversaryColor = 'white';
	} else {
		bottomRight.classList.remove('white');
		bottomRight.classList.add('black');

		// bottomRight.classList.remove('black');
		// bottomRight.classList.add('white');

		event = 'white to black';
		adversaryColor = 'black';
	}

	var data = {
		user: user,
		event: event,
		currentColor: adversaryColor,
		time: new Date().toISOString(),
		randomizedDelay: null
	};

	console.log('%c Outgoing message:', 'color: green');
	console.table(data);

	createNewEventInStorage(data);

	socket.emit('message', data);
});

var timerChecker = true;

window.onbeforeunload = function(e) {
	if (timerChecker) {
		e = e || window.event;

		// For IE and Firefox prior to version 4
		if (e) {
			e.returnValue = 'Sure?';
		}

		// For Safari
		return 'Sure?';
	}
};

setTimeout(function() {
	// after 60 seconds
	timerChecker = false;
	window.location = `survey`;
}, 10000);

function appendToMessageList(newMessageName) {
	temp = JSON.parse(sessionStorage.getItem('listOfMessages')).list;
	console.log('temp', temp);
	temp.push(newMessageName);
	var wrapper = {
		list: temp
	};
	sessionStorage.setItem('listOfMessages', JSON.stringify(wrapper));
}

function createNewEventInStorage(eventJSON) {
	sessionStorage.setItem(eventJSON.time, JSON.stringify(eventJSON));
	appendToMessageList(eventJSON.time);
}

function getAllOfSessionStorage() {
	list = JSON.parse(sessionStorage.getItem('listOfMessages')).list;
	list.forEach((element) => {
		var temp = JSON.parse(sessionStorage.getItem(element));
		console.table(temp);
	});
}

function getMostRecentMessage() {
	list = JSON.parse(sessionStorage.getItem('listOfMessages')).list;
	lastFile = list[list.length - 1];
	var jsonFile = JSON.parse(sessionStorage.getItem(lastFile));
	return jsonFile.time;
	//returns in ISO DATE format
}

function compareToCurrentTime(lastTime) {
	var currentTime = new Date().getTime();
	var formattedLastTime = newDate(lastTime);
	if (Math.abs(currentTime - formattedLastTime) > 2000) {
		return true;
	}
}

var intervalID = setInterval(recentMessageChecker, 5000);
