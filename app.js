var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.use(express.static('public'));

//can not start game without judge
var hasJudge = false;
// var onlineUserCount = 0;
var onlinePlayers = [];

//game ws server

//judge Enter when the Kiosk display the page of /kiosk/index.html
io.use(function (socket, next) {
	if (socket.handshake.query.role === "judge") {
		console.log("judge enter the room");
		hasJudge = true;
		socket.on("disconnect", function () {
			hasJudge = false;
			console.log("judge leave the room");
		});
	} else if (socket.handshake.query.role === "competitor") {
		socket.on("disconnect", function () {
			// onlineUserCount = 0;
			onlinePlayers.length = 0;
			//need client re-regist when anyone quit
			io.emit("refresh");
			console.log("some competitor quit!!! force refresh!");
		});
	}
	return next();
})

var regist = function(socket) {
	socket.on("regist", function (userInfo) {
		// onlineUserCount++;
		// console.log("Regist User -> " + userInfo.FullName);
		// console.log("competitor enter the room, current competitor count " + onlineUserCount);
		if(onlinePlayers.length <= 1) {
			onlinePlayers.push(userInfo);
			console.log("current players " + onlinePlayers.length);
			io.emit("regist", {playersList:onlinePlayers});
		} else {
			socket.emit("room full");
		}
	})
}

var handleClient = function(socket) {

	regist(socket);

	socket.on("start", function(){
		console.log("Game starts");
		io.emit("start");
	})

	socket.on("disconnect", function (param1) {
		console.log("user disconnected, param1 -> " + param1);
	});
}

io.on("connection", handleClient);


http.listen(8087, function () {
	console.log("listen on port 8087");
});