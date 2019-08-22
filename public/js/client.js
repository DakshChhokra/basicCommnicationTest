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
		delay: null
	};

	var bufferList = getList();
	var bufflen = bufferList.length;

	if (bufflen == 0) {
		data.delay = 0;
	} else {
		lastTime = bufferList[bufflen - 1];
		console.log(`%c Buffer has length ${bufflen} \n and last element is ${lastTime}`, 'color: orange');
		console.log('bufferList[0]', lastTime);
		console.log(compareTimes(lastTime, data.time));
		data.delay = compareTimes(lastTime, data.time);
		// data.delay = Math.ceil(compareTimes(lastTime, data.time) / 100) * 100;
	}

	console.log('%c Saving message:', 'color: blue');
	console.table(data);

	createNewEventInStorage(data);
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
}, 1080000);

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
	var formattedLastTime = new Date(lastTime);
	console.log('wait time to prev message is:', Math.abs(currentTime - formattedLastTime));
	if (Math.abs(currentTime - formattedLastTime) > 5000) {
		return true;
	}
}

function compareTimes(time1, time2) {
	var time1mod = new Date(time1).getTime();
	var time2mod = new Date(time2).getTime();
	return Math.abs(time1mod - time2mod);
}

function getList() {
	return JSON.parse(sessionStorage.getItem('listOfMessages')).list;
}

function recentMessageChecker() {
	// console.log(JSON.parse(sessionStorage.getItem('listOfMessages')));
	var someList = getList();
	if (someList.length > 0) {
		if (compareToCurrentTime(getMostRecentMessage())) {
			console.log('SENDING MESSAGE NOW');
			list = JSON.parse(sessionStorage.getItem('listOfMessages')).list;
			var sendableList = [];
			list.forEach((element) => {
				var data = JSON.parse(sessionStorage.getItem(element));
				console.log('%c Outgoing message:', 'color: green');
				console.table(data);
				sendableList.push(data);
			});

			socket.emit('message', sendableList);
			var somelist = [];
			var wrapperWax = {
				list: somelist
			};
			sessionStorage.removeItem('listOfMessages');
			sessionStorage.setItem('listOfMessages', JSON.stringify(wrapperWax));
		}
	}
}

var intervalID = setInterval(recentMessageChecker, 1000);
