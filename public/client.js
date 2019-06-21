
const body = document.querySelector("body");
const bottomRight = document.querySelector(".bottom-right");
var event = null;
var user = prompt("Please enter your name");
var room =  prompt("Please enter your id");


// set-up a connection between the client and the server
var socket = io.connect();


socket.on('connect', function() {
   // Connected, let's sign-up for to receive messages for this room
   var input = {id: room, user: user};
   socket.emit('room', input);
});

socket.on('message', function(data) {
    console.log('Incoming message:', data);
    if(data.event == "black to white"){
        body.classList.remove("black");
        body.classList.add("white");

        bottomRight.classList.remove("white");
        bottomRight.classList.ådd("black");
        event = "white to black";
    } else if (data.event == "white to black"){
        body.classList.remove("white");
        body.classList.add("black") ;

        bottomRight.classList.remove("black");
        bottomRight.classList.ådd("white");
        event = "black to white";
    }
 });

 socket.on('disconnect', () => {
     console.log("User has disconnected");
 })


body.addEventListener("click", () => {
    if(body.classList.contains("black")){
        body.classList.remove("black");
        body.classList.add("white");

        bottomRight.classList.remove("white");
        bottomRight.classList.ådd("black");
        event = "black to white";
    } else {
        body.classList.remove("white");
        body.classList.add("black") ;

        bottomRight.classList.remove("black");
        bottomRight.classList.ådd("white");

        event = "white to black";
    }

    var data = {
        user: user, 
        event: event, 
        time: new Date().toISOString()
    };

    console.log('Outgoing message:', data);
    
    socket.emit("message", data);
})



