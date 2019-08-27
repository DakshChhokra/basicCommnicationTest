/**
	Stores the users credentials in session storage so that it can be accesed from any page.
 */
function store() {
	sessionStorage.setItem('username', document.getElementById('username').value);
	sessionStorage.setItem('identifier', document.getElementById('identifier').value);
}
window.onbeforeunload = function(e) {
	if (document.getElementById('identifier').value == '' || document.getElementById('username').value == '') {
		e = e || window.event;

		// For IE and Firefox prior to version 4
		if (e) {
			e.returnValue = 'Sure?';
		}

		// For Safari
		return 'Sure?';
	}
};
