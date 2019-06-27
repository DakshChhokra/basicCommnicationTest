const body = document.querySelector('body');
const bottomRight = document.querySelector('div');
var event = null;
var user = prompt('Please enter your name');
var room = prompt('Please enter your id');
var currentColor = 'black';

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

		bottomRight.classList.remove('white');
		bottomRight.classList.add('black');
		event = 'black to white';
		currentColor = 'white';
	} else if (data.event == 'white to black') {
		body.classList.remove('white');
		body.classList.add('black');

		bottomRight.classList.remove('black');
		bottomRight.classList.add('white');
		event = 'white to black';
		currentColor = 'black';
	}
	socket.emit('color-update', { color: currentColor });
});

socket.on('disconnect', () => {
	console.log('User has disconnected');
});

socket.on('color-update', () => {
	socket.emit('color-update', { color: currentColor });
});

body.addEventListener('click', () => {
	if (body.classList.contains('black')) {
		body.classList.remove('black');
		body.classList.add('white');

		bottomRight.classList.remove('white');
		bottomRight.classList.add('black');
		event = 'black to white';
		currentColor = 'white';
	} else {
		body.classList.remove('white');
		body.classList.add('black');

		bottomRight.classList.remove('black');
		bottomRight.classList.add('white');

		event = 'white to black';
		currentColor = 'black';
	}

	var data = {
		user: user,
		event: event,
		currentColor: currentColor,
		time: new Date().toISOString(),
		randomizedDelay: null
	};

	console.log('%c Outgoing message:', 'color: green');
	console.table(data);

	socket.emit('message', data);
	socket.emit('color-update', { color: currentColor });
});
