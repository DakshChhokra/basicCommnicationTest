var username = document.createElement('input');

username.setAttribute('type', 'hidden');

username.setAttribute('name', 'username');

username.setAttribute('value', sessionStorage.getItem('username'));

//append to form element that you want .
document.getElementById('mainForm').appendChild(username);

var identifier = document.createElement('input');

identifier.setAttribute('type', 'hidden');

identifier.setAttribute('name', 'identifier');

identifier.setAttribute('value', sessionStorage.getItem('identifier'));

//append to form element that you want .
document.getElementById('mainForm').appendChild(identifier);

window.onbeforeunload = function(e) {
	if (
		document.getElementById('Comms1').value == '' ||
		document.getElementById('Comms2').value == '' ||
		document.getElementById('Comms3').value == '' ||
		document.getElementById('Check').checked == false
	) {
		e = e || window.event;

		// For IE and Firefox prior to version 4
		if (e) {
			e.returnValue = 'Sure?';
		}

		// For Safari
		return 'Sure?';
	}
};

function getAllOfSessionStorage() {
	list = JSON.parse(sessionStorage.getItem('listOfMessages')).list;
	list.forEach((element) => {
		var temp = JSON.parse(sessionStorage.getItem(element));
		console.table(temp);
	});
}
