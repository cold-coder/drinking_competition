var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.use(express.static('public'));

//can not start game without judge
var hasJudge = false;
// var onlineUserCount = 0;
var onlinePlayers = [];
var score = {};

//game ws server


var handleClient = function(socket) {

	//on connection
	if (socket.handshake.query.role === "competitor") {
		var player = socket.handshake.query;
		if(onlinePlayers.length <= 1) {
				onlinePlayers.push(player);
				score[player.id] = 0;

				console.log(onlinePlayers.length + " players ==> " + onlinePlayers[0].id + (onlinePlayers.length===2 ? " | " + onlinePlayers[1].id + "." : "."));

				io.emit("enter", player);
				io.emit("sync", onlinePlayers);
		} else {
				socket.emit("room full");
				return;
		}

		socket.on("disconnect", function () {
			var player = socket.handshake.query;

			onlinePlayers.forEach(function(currPlayer, i){
				if(currPlayer["id"] === player.id) {
					onlinePlayers.splice(i, 1);
				}
			});

			console.log(player.id + " leave the room");


			io.emit("exit", player);
			io.emit("sync", onlinePlayers);
		});
	} else if (socket.handshake.query.role === "judge") {
		//disconnect all clients when kiosk refreshs
		// io.sockets.sockets.forEach(function(s) {
		//     s.disconnect(true);
		// });

		// console.log(Object.keys(io.sockets.sockets));

		onlinePlayers.length = 0;
		console.log("judge enter the room");
		hasJudge = true;
		socket.on("disconnect", function () {
			hasJudge = false;
			console.log("judge leave the room");
		});
	} 





	socket.on("start", function(){
		console.log("Game starts");
		score = {};
		score[onlinePlayers[0].id] = 0;
		score[onlinePlayers[1].id] = 0;
		io.emit("start", {playersList:onlinePlayers});
	});

	socket.on("gameover", function(winnerData){
		console.log("Game over, winner id is " + winnerData.winnerId);
		io.emit("gameover", winnerData);
	})

	socket.on("score", function(scoreData) {
		console.log(scoreData.id + " socres at " + scoreData.score);
		score[scoreData.id] += scoreData.score;
		console.log("score-> "+ JSON.stringify(score));
		io.emit("score", score);
	})

	// socket.on("disconnect", function (param1) {
	// 	console.log("user disconnected, param1 -> " + param1);
	// });
}

io.on("connection", handleClient);


http.listen(8087, function () {
	console.log("listen on port 8087");
});