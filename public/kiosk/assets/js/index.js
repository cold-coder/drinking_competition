$(document).ready(function(){
	var config = {
		gameWS: "http://127.0.0.1:8087/",//http://demowifi.smartac.co:8087
		accountId: "gh_4ffca3361cb7", //微信公众号ID
		srapiurl: "http://srdemo.smartac.co/api/", //SR API地址前缀
    };

    var onlinePlayers = []; //[{id:"f29e3ef1", headPortrait:"./img/fe.png", fullName:"tom"},{id:"i9oi8hhikj", headPortrait:"./img/ed.png", fullName:"jerry"}]
    var playScore;
    var TOTALSCORE = 100000;

    var socket = io(config.gameWS, { query:"role=judge"});
    socket.on("regist", function(players){
    	if(players.playersList.length ==1) {
    		$(".step1").hide();
            $(".step2").show();
            $(".step2 .avatar_left").css("background-image", "url(" + players.playersList[0].headPortrait + ")");
            $(".step2 .nickname_txt_left").text(players.playersList[0].fullName);
            $(".step2 .avatar_right").css("background-image", "url('./assets/img/qr_code.jpg')");
            $(".step2 .nickname_txt_right").text("扫码加入游戏");
    		console.log(players.playersList[0].fullName + " has enter the room, waiting another competitor");
    	} else if (players.playersList.length == 2) {
            console.log("2 players, they are " + players.playersList[0].fullName + " and " + players.playersList[1].fullName)
            $(".step2 .avatar_right").css("background-image", "url(" + players.playersList[1].headPortrait + ")");
            $(".step2 .nickname_txt_right").text(players.playersList[1].fullName);

            //store player info to local
            onlinePlayers = players.playersList;
    		//begin countdown

            setTimeout(function(){
                $(".step2").hide();
                $(".step3").show().addClass("ani-countdown");
            }, 2000);

            setTimeout(function(){
                socket.emit("start");
            }, 6000)
    	} else {
    		console.log("Should not get here");
    	}
    })

    socket.on("refresh", function(){
    	location.reload();
    });

    $(".btn_refresh").on("click", function(){
        location.reload();
    });

    socket.on("score", function(score) {
        //{"tom": 12323487, "jerry": 52343432}
        playScore = score;
        updateScore(playScore)
    })


    function updateScore(score) {
        var score_left = score[onlinePlayers[0].id];
        var score_right = score[onlinePlayers[1].id];
        if(score_left > TOTALSCORE){
            drinkUp($(".beer_left_6"));
            socket.emit("gameover",{winnerId:onlinePlayers[0].id});
            return;
        }
        if(score_right > TOTALSCORE){
            drinkUp($(".beer_right_6"));
            socket.emit("gameover",{winnerId:onlinePlayers[1].id});
            return;
        }
        clearBeerCup(score_left, "left");
        clearBeerCup(score_right,"right");
    }

    //beer disappear animation
      var beerDrinkUp = {
        p: {
          opacity: 0,
          top:0
        },
        o: {
          duration: 400,
          easing: "linear"
        }
      }
      var drinkUp = function(e) {
        e.velocity(beerDrinkUp.p, beerDrinkUp.o);
      }

    function clearBeerCup (score, side) {
        var scorePercent = (score/TOTALSCORE)*100;
        console.log("score/TOTALSCORE-> "+scorePercent);

        var scoreBarWidth = (score/TOTALSCORE) * 265;
        
        //score bar update
        $(".score_"+side).velocity({width: scoreBarWidth},"spring");

        //beer cup update
        if(scorePercent > 16.6 && scorePercent < 33.3){
            drinkUp($(".beer_"+side+"_1"));
        }else if(scorePercent > 33.3 && scorePercent < 50){
            drinkUp($(".beer_"+side+"_2"));
        }else if(scorePercent > 50 && scorePercent < 66.6){
            drinkUp($(".beer_"+side+"_3"));
        }else if(scorePercent > 66.6 && scorePercent < 83.3){
            drinkUp($(".beer_"+side+"_4"));
        }else if(scorePercent > 83.3 && scorePercent < 100){
            drinkUp($(".beer_"+side+"_5"));
        }
    }

    socket.on("start", function(){
        console.log("Game starts");
        $(".step3").hide();
        $(".step4").show();
        $(".step4 .avatar_left").css("background-image", "url(" + onlinePlayers[0].headPortrait + ")");
        $(".step4 .avatar_right").css("background-image", "url(" + onlinePlayers[1].headPortrait + ")");
        $(".role_left").addClass("role_left_ingame");
        $(".role_right").addClass("role_right_ingame"); 
    });

    socket.on("gameover", function(winner){
        var winnerSide = "";
        var loseSide = "";
        if(winner.winnerId == onlinePlayers[0].id) {
            winnerSide = "left";
            loseSide = "right";
            $(".reward .avatar_winner").css("background-image", "url(" + onlinePlayers[0].headPortrait + ")");
            $(".reward .nickname_winner_txt").text(onlinePlayers[0].fullName);
        } else if (winner.winnerId == onlinePlayers[1].id) {
            $(".reward .avatar_winner").css("background-image", "url(" + onlinePlayers[1].headPortrait + ")");
            $(".reward .nickname_winner_txt").text(onlinePlayers[1].fullName);
            winnerSide = "right";
            loseSide = "left";
        }
        //add effect for winner
        $(".role_"+winnerSide).removeClass("role_"+winnerSide+"_ingame").addClass("role_"+winnerSide+"_win");
        $(".shine_"+winnerSide).addClass("win_shine");
        //add effect for loser
        $(".role_"+loseSide).removeClass("role_"+loseSide+"_ingame").addClass("role_"+loseSide+"_lose");


        //reward page
        setTimeout(function(){
            $(".step4").hide();
            $(".step5").show();
        }, 4000);
    })
})