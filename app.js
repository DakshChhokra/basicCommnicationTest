const   express      = require("express"),
        app          = express(),
        bodyParser   = require('body-parser'),
        socketio     = require("socket.io"),
        mongoose     = require("mongoose");

const mongooseConfig = {
    useNewUrlParser: true
};

var mongoDBPort = process.env.MONGODB_URI || "mongodb://localhost:27017/basicComms";
console.log(mongoDBPort);

mongoose.connect(mongoDBPort, mongooseConfig);
mongoose.set('useFindAndModify', false);

var clientSideColor;

//mongoose set up
var Schema = mongoose.Schema;

var sampleCommunication = { 
    user: String, 
    event: String, 
    dateString: String,
    randomizedDelay: String
};

var log = new Schema({
    name: String,
    identifier: String,
    messages: [sampleCommunication]
});


var Log = mongoose.model("Log", log);





//config

var port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }))
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));



//Routes
app.get("/communication", (req, res) => {
    res.render("index");
})

app.get("/admin", (req, res) => {
    res.render("admin");
})

app.get("/", (req, res) => {
    res.render("login")
})

app.post("/", (req, res) => {
    res.redirect("/communication")
})



//Start Server
var server = app.listen(port, () => {
    console.log("Server started on port " + port);
})



// attach Socket.io to our HTTP server
var io = socketio.listen(server);
var roomID = "12345";
// handle incoming connections from clients
io.sockets.on('connection', function(socket) {
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    console.log("****************");
    console.log("New incoming connection");
    console.log("****************");
    var currUser = null;
    var currID = null;
    socket.on('room', function(room) {
        console.log("Room join request on: " + room.id);
        currUser = room.user;
        currID = room.id;
        Log.create({name: currUser, identifier: currID, messages: []});

        socket.join(room.id, () => {
            console.log("Server says: " + "Welcome, " + room.user + "! You succesfully joined room with the id " + room.id);
            var welcome = {
                user: "Server", 
                event: "Hallo! You are succefully connected to the room with the id " + room.id, 
                time: new Date().toISOString()
            }
            io.to(room.id).emit('message', welcome);
        });
    });
    

    socket.on('message', (data) => {
        // console.log(`%c ${data.user} says: ${data.event} at ${data.time}`, 'color: orange');
        console.table(data);
        

        Log.findOneAndUpdate({identifier: currID}, 
            {$push: {messages: { 
                user: data.user, 
                event: data.event, 
                dateString: data.time,
                randomizedDelay: null
            }}}, 
            {new: true}, (err, result) => {
            // Rest of the action goes here
            if (err){
                console.log("Error!", err);
            }
           });
        serverResponse(data.event, currID);
        
    })

    socket.on('color-update', (colorUpdate) => {
        console.log(`Client updated color. Current color on client side is ${colorUpdate.color}`)
        clientSideColor = colorUpdate.color;
    })
    
    socket.on('disconnect', (dis) => {
        console.log("****************");
        console.log(currUser + " has left the room with id " + currID + " at " + new Date().toISOString());
        console.log("****************");

    })


});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
async function serverResponse(event, currID) {
    var randomTime = getRandomInt(2000, 5000);
    // console.log(`################################### Randomized server response time is: ${randomTime/1000}s ###########################`);
    await sleep(randomTime);

    var dataPacket = {
        user: "Server",
        event: null,
        time: new Date().toISOString()
    };

    if (event == "black to white"){
        dataPacket.event = "white to black"
    } else {
        dataPacket.event = "black to white"
    }

    

    Log.findOneAndUpdate({identifier: currID}, 
                    {$push: {messages: 
                        { 
                            user: dataPacket.user, 
                            event: dataPacket.event, 
                            dateString: dataPacket.time,
                            randomizedDelay: randomTime + "s"
                        }}}, 
                    {new: true}, (err, result) => {
                    // Rest of the action goes here
                    if (err){
                        console.log("Error!", err);
                    }
                   });
    io.emit('message', dataPacket);

    // console.log(`${dataPacket.user} says: ${dataPacket.event} at ${dataPacket.time}`);
    console.table(dataPacket);
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

