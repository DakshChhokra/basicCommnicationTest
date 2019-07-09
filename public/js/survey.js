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
