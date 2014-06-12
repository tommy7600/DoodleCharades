var http = require('http');
var filesystem = require('fs');
var path = require('path');

var server = http.createServer(function (request, response) {
    var contentType;
    var filetoserve;
    var extname = path.extname(request.url);
    switch (extname) {
    case '.css':
        contentType = 'text/css';
        filetoserve = "chat.css";
        console.log("Served chat.css");
        break;
    case '.js':
        contentType = 'text/javascript';
        filetoserve = "chat.js";
        console.log("Served chat.js");
        break;
    default:
        contentType = 'text/html';
        filetoserve = "chat.html";
        console.log("Served chat.html");
        break;
    }
    filesystem.readFile(filetoserve, 'utf-8', function (error, data) {
        response.writeHead(200, {'Content-Type': contentType});
        response.write(data);
        response.end();
    });
}).listen(INSERT PORT NUMBER ON WHICH TO LISTEN);

var io = require('socket.io').listen(server);

var keywords = ["mosquito", "sunglasses", "kick", "football", "skip", "dance", "alligator", "door", "swing", "pen", "apple", "toothbrush", "elbow", "goldfish", "violin", "roof", "bike", "rain", "bird", "cape", "alarm", "guitar", "snowball", "cow", "summer", "rollerblade", "bag", "basket", "scarf", "jellyfish", "banana", "food", "money", "soap", "lipstick", "mop", "trumpet", "popcorn", "shovel", "dog", "cat", "toes", "stairs", "bird", "lawn mower", "brain", "flamingo", "web", "carrot", "cowboy", "torch", "gym", "beetle", "spine", "hair", "pizza", "softball", "vest", "stain", "sand", "funny", "wrench", "party", "knot", "anger", "nightmare", "marble", "poison", "mouse", "shipwreck", "bubble", "flag", "music", "police", "gun", "island", "evolution", "flower", "feather", "daughter", "mitten", "award", "deer", "taco"];
var currKeyword;
var currTurn;
var currid;
var clients = {};
var randomField = function (obj) {
    var keys = Object.keys(obj);
    currid = keys[Math.floor(keys.length * Math.random())];
    return obj[currid];
};

function getNewKeyword() {
    currKeyword = keywords[Math.floor(Math.random() * 84)];
    console.log(currKeyword);
}

function nextTurn() {
    getNewKeyword();
    if (Object.keys(clients).length > 0) {
        currTurn = randomField(clients);
        console.log(currTurn);
        console.log(currid);
        io.sockets.emit("next_turn", {name: currTurn, id: currid, word: currKeyword});
    }
}

var mytimer = setInterval(nextTurn, 60000);

io.sockets.on('connection', function (socket) {
    socket.on('message_from_client', function (data) {
        if (data.message.toLowerCase() === currKeyword && (data.name !== currTurn || data.id !== currid)) {
            io.sockets.emit("message_to_client", {name: data.name, message: data.message});
            io.sockets.emit("message_to_client", {name: data.name, message: "<-- Guessed the correct word! The answer was: " + currKeyword});
            clearInterval(mytimer);
            mytimer = setInterval(nextTurn, 60000);
            nextTurn();
        } else {
            io.sockets.emit("message_to_client", {name: data.name, message: data.message});
        }
    });
    
    socket.on('new_user', function (data) {
        clients[socket.id] = data.name;
        io.sockets.emit("update_users", {numUsers: Object.keys(clients).length});
        if (Object.keys(clients).length === 1) {
            nextTurn();
        }
    });
                
    socket.on('drawing', function (data) {
        socket.broadcast.emit("draw", {x : data.x, y : data.y, drag : data.drag });
    });

    socket.on('endDrag', function (data) {
        socket.broadcast.emit("dragEnd", {});
    });
    
    socket.on('disconnect', function () {
        delete clients[socket.id];
        io.sockets.emit("update_users", {numUsers: Object.keys(clients).length});
    });
});
