var socket = io.connect("http://54.187.31.161:8080/");
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

context.strokeStyle = "#132DD4";
context.fillStyle = "#132DD4";
context.lineWidth = 20;
context.lineCap = "round";

var radius = 10;
var drag = false;
var myTurn = false;
var myName;

var draw = function (x, y, drag) {
    if (drag) {
        context.lineTo(x, y);
        context.stroke();
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(x, y);
    }
};

socket.on("message_to_client", function (data) {
    document.getElementById("chatbox").innerHTML = (document.getElementById("chatbox").innerHTML + "<br/>" + data.name + ": " + data.message);
    $("#chatbox").prop({ scrollTop: $("#chatbox").prop("scrollHeight") });
});

socket.on("update_users", function (data) {
    document.getElementById("numUsers").innerHTML = "Current number of users: " + data.numUsers;
	$("numUsers").css("align", "center");
});

socket.on("next_turn", function (data) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (data.name === myName && data.id === socket.socket.sessionid) {
        myTurn = true;
        document.getElementById("keyword").innerHTML = "Your word to draw is: " + data.word;
    } else {
        myTurn = false;
        document.getElementById("keyword").innerHTML = " ";
        $('#messagebox').focus();
    }
});

socket.on('draw', function (data) {
    return draw(data.x, data.y, data.drag);
});

socket.on('dragEnd', function (data) {
    drag = false;
    context.beginPath();
	return;
});

var putPoint = function (e) {
    if (myTurn === true) {
        if (drag) {
            var canvasOffSet = $("#canvas").offset();
            var x = e.pageX - canvasOffSet.left;
            var y = e.pageY - canvasOffSet.top;
            context.lineTo(x, y);
            context.stroke();
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.moveTo(x, y);
            socket.emit("drawing", {x : x, y : y, drag : drag});
        }
    }
};

var dragOn = function (e) {
    if (myTurn === true) {
        drag = true;
        putPoint(e);
    }
};

var dragOff = function (e) {
    if (myTurn === true) {
        drag = false;
        context.beginPath();
        socket.emit("endDrag", {});
    }
};

// For mobile gestures
var touchToMouse = function (event) {
    if (event.touches.length > 1) {
        return;
    }
    var touch = event.changedTouches[0];
    var type = "";
    
    switch (event.type) {
    case "touchstart":
        type = "mousedown";
        break;
    case "touchmove":
        type = "mousemove";
        break;
    case "touchend":
        type = "mouseup";
        break;
    default:
        return;
    }
    
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);
    
    touch.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
};

canvas.ontouchstart = touchToMouse;
canvas.ontouchmove = touchToMouse;
canvas.ontouchend = touchToMouse;

// End of mobile gesture stuff


canvas.addEventListener('mousedown', dragOn);
canvas.addEventListener('mouseup', dragOff);
canvas.addEventListener('mousemove', putPoint);

function sendMessage() {
    var msg = document.getElementById("messagebox").value;
    document.getElementById("messagebox").value = "";
    socket.emit("message_from_client", {name: document.getElementById("canvas").value, message : msg, id: socket.socket.sessionid});
    $('#messagebox').focus();
}

$('#messagebox').keypress(function (e) {
    if (e.which === 13) {
        sendMessage();
        return false;
    }
});

function addUser() {
    $('#joinbutton').remove();
    document.getElementById("userfield").readOnly = true;
    myName = document.getElementById("userfield").value;
	document.getElementById("canvas").value = myName;
    $('#userfield').remove();
    $('#nameEntry').remove();
    document.getElementById("messagebox").readOnly = false;
    socket.emit("new_user", {name: myName});
    socket.emit("message_from_client", {name: "Server", message : "Welcome " + myName + ", in this game players take turns drawing / guessing words"});
    $('#messagebox').focus();
}

$('#userfield').keypress(function (e) {
    if (e.which === 13) {
        addUser();
        return false;
    }
});

function disableMsg() {
    document.getElementById("messagebox").readOnly = true;
}
