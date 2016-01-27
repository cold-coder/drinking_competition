var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.use(express.static('public'));

//can not start game without judge
var hasJudge = false;
var onlineUserCount = 0;

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
			onlineUserCount = 0;
			//need client re-regist when anyone quit
			io.emit("refresh");
			console.log("some competitor quit!!! force refresh!");
		});
	}
	return next();
})

var regist = function(socket) {
	console.log("=====begin in regist=====");
	socket.on("regist", function (userInfo) {
		onlineUserCount++;
		console.log("Regist User -> " + userInfo.FullName);
		console.log("competitor enter the room, current competitor count " + onlineUserCount);
		if(onlineUserCount <= 2) {
			io.emit("regist", {userCount: onlineUserCount ,userInfo: userInfo});
		} else {
			socket.emit("room full");
		}
	})
}

var handleClient = function(socket) {

	regist(socket);

	socket.on("disconnect", function (param1) {
		console.log("user disconnected, param1 -> " + param1);
	});
}

io.on("connection", handleClient);


//http server
// var router = express.Router();

// router.get("/kiosk", function (req, res) {
// 	var options = {
// 		root: __dirname + "/public/kiosk/",
// 		headers: {
// 			'x-timestamp': Date.now(),
// 			'x-send': true
// 		}
// 	};

// 	var fileName = "index.html";
// 	res.sendFile(fileName, options, function (err) {
// 		if(err) {
// 			console.log(err);
// 			res.status(err.status).end();
// 		} else {
// 			console.log('Sent: ', fileName);
// 		}
// 	})
// })

http.listen(8087, function () {
	console.log("listen on port 8087");
});