
function clearSessionStorage() {
	list = Object.keys(sessionStorage);
	list.forEach((element) => {
		sessionStorage.removeItem(element);
		console.log(`Removing ${element}`);
	});
	sessionStorage.removeItem('listOfMessages');
}
clearSessionStorage();
