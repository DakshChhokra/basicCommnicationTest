var sessionColorStorer = [
	{
		id: 'test',
		currentColor: 'hara-bhara'
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

const testColor = getColor('test');
console.log('Current color of test is ' + testColor);

addID('lund', 'black');
console.log(`Current color of lund is ${getColor('lund')}`);
updateColor('lund', 'white');
console.log(`Current color of lund is ${getColor('lund')}`);
addID('dick', 'black');
console.log(`Current color of dick is ${getColor('dick')}`);
updateColor('lund', 'black');
updateColor('dick', 'white');
console.log(`Current color of lund is ${getColor('lund')}`);
console.log(`Current color of dick is ${getColor('dick')}`);
console.log('sessionColorStorer', sessionColorStorer);
