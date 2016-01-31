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
            $(".avatar_left").css("background-image", "url(" + players.playersList[0].headPortrait + ")");
            $(".nickname_txt_left").text(players.playersList[0].fullName);
            $(".avatar_right").css("background-image", "url('./assets/img/qr_code.jpg')");
            $(".nickname_txt_right").text("");
    		console.log(players.playersList[0].fullName + " has enter the room, waiting another competitor");
    	} else if (players.playersList.length == 2) {
            console.log("2 players, they are " + players.playersList[0].fullName + " and " + players.playersList[1].fullName)
            $(".avatar_right").css("background-image", "url(" + players.playersList[1].headPortrait + ")");
            $(".nickname_txt_right").text(players.playersList[1].fullName);

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
            //display stage section after animation
            // setTimeout(function(){
            //     $(".step3").hide();
            //     $(".step4").show();
            // }, 7000);
    	} else {

    		console.log("Should not get here");
    	}
    })

    socket.on("refresh", function(){
    	$(".avatar*").prop("src","");
    });

    socket.on("score", function(score) {
        //{"tom": 12323487, "jerry": 52343432}
        playScore = score;
        updateScore(playScore)
    })


    function updateScore(score) {
        var score_left = score[onlinePlayers[0].id];
        var score_right = score[onlinePlayers[1].id];
        clearBeerCup(score_left, "left");
        clearBeerCup(score_right,"right")
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
        e.velocity(beerDrinkUp.p, beerDrinkUp.o)
      }

    function clearBeerCup (score, side) {
        var scorePercent = score/TOTALSCORE;
        console.log("score/TOTALSCORE-> "+scorePercent);
        if(scorePercent > 0.2 || scorePercent < 0.4){
            drinkUp($(".beer_"+side+"_1"));
        }else if(scorePercent > 0.4 || scorePercent < 0.6){
            drinkUp($(".beer_"+side+"_2"));
        }else if(scorePercent > 0.6 || scorePercent < 0.8){
            drinkUp($(".beer_"+side+"_3"));
        }else if(scorePercent > 0.8 || scorePercent < 1){
            drinkUp($(".beer_"+side+"_4"));
        }else if(score/TOTALSCORE > 1.2){
            drinkUp($(".beer_"+side+"_5"));
        } else if(score/TOTALSCORE > 1.4){
            drinkUp($(".beer_"+side+"_6"));
            console.log("win");
        }
    }

    socket.on("start", function(){
        console.log("Game starts");
        $(".step3").hide();
        $(".step4").show();
        $(".avatar_left").css("background-image", "url(" + onlinePlayers[0].headPortrait + ")");
        $(".avatar_right").css("background-image", "url(" + onlinePlayers[1].headPortrait + ")");        
    })
})