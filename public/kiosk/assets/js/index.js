$(document).ready(function(){
	var config = {
		gameWS: "http://127.0.0.1:8087/",
        // gameWS: "http://demowifi.smartac.co:8087",
		accountId: "gh_4ffca3361cb7", //微信公众号ID
		srapiurl: "http://srdemo.smartac.co/api/", //SR API地址前缀
    };

    var onlinePlayers = []; //[{id:"f29e3ef1", headPortrait:"./img/fe.png", fullName:"tom"},{id:"i9oi8hhikj", headPortrait:"./img/ed.png", fullName:"jerry"}]
    var playScore;
    var TOTALSCORE = 100000;
    var GameStatus = {
        WAITING:"WAITING",
        PLAYING:"PLAYING",
        REWARDING:"REWARDING"
    }
    var currentStatus = GameStatus.WAITING;

    var socket = io(config.gameWS, { query:"role=judge"});

    socket.on("sync", syncPlayer);

    socket.on("start", startGame);

    socket.on("score", updateScore);

    socket.on("gameover", reward);


    socket.on("enter", function(player){
        showToast(player.headPortrait, "ENTER", player.fullName);
    })

    socket.on("exit", function(player){
        showToast(player.headPortrait, "EXIT", player.fullName);
    })

    $(".btn_refresh").on("click", function(){
        location.reload();
    });


    function syncPlayer(players){
        // console.log(players);
        console.log(currentStatus);

        //special handle for player abort during playing
        if(currentStatus === GameStatus.PLAYING && players.length == 1){
            socket.emit("gameover",{winnerId:players[0].id});
            return;
        }

        //special handle for lose player quit, still showing winner page
        if(currentStatus === GameStatus.REWARDING && players.length == 1){
            return;
        }

        if(players.length == 1) {
            $(".step1").hide();
            $(".step2").show();
            $(".step2 .avatar_left").css("background-image", "url(" + players[0].headPortrait + ")");
            $(".step2 .nickname_txt_left").text(players[0].fullName);
            $(".step2 .avatar_right").css("background-image", "url('./assets/img/qr_code.jpg')");
            $(".step2 .nickname_txt_right").text("扫码加入游戏");
            console.log(players[0].fullName + " has enter the room, waiting another player");
        } else if (players.length == 2) {
            console.log("2 players, they are " + players[0].fullName + " and " + players[1].fullName)
            $(".step2 .avatar_right").css("background-image", "url(" + players[1].headPortrait + ")");
            $(".step2 .nickname_txt_right").text(players[1].fullName);

            //store player info to local
            onlinePlayers = players;

            //display two players info for 2 seconds
            //countdown animation
            var countdownShow = {
                p: {
                  opacity: 1,
                  scale: 0.7
                },
                o: {
                  duration: 500,
                  easing: "linear"
                }
              }
            var countdownHide = {
                p: {
                  opacity: 0
                },
                o: {
                  duration: 500,
                  easing: "linear"
                }
              }
            var countdownGoShow = {
                p: {
                  opacity: 1,
                  scale: 1
                },
                o: {
                  duration: 1000,
                  easing: "linear"
                }
              }
            //delay 2s for waiting kiosk display two players info
            var loadingSequence = [
                { e: $(".mask"), p: {opacity:0.6}, o: {display:"block", delay:2000}},
                { e: $(".countdown_3"), p: countdownShow.p, o: countdownShow.o},
                { e: $(".countdown_3"), p: countdownHide.p, o: countdownHide.o},
                { e: $(".countdown_2"), p: countdownShow.p, o: countdownShow.o},
                { e: $(".countdown_2"), p: countdownHide.p, o: countdownHide.o},
                { e: $(".countdown_1"), p: countdownShow.p, o: countdownShow.o},
                { e: $(".countdown_1"), p: countdownHide.p, o: countdownHide.o},
                { e: $(".countdown_go"), p: countdownGoShow.p, o: countdownShow.o},
                { e: $(".countdown_go"), p: countdownHide.p, o: countdownHide.o},
                { e: $(".mask"), p: {opacity:0}, o: {display:"none"}}
            ]

            //about 5 seconds
            $.Velocity.RunSequence(loadingSequence);
            // setTimeout(function(){
            //     $(".step2").hide();
            //     $(".step3").show().addClass("ani-countdown");
            // }, 2000);

            //wait 7 seconds for client side wait(2s) + countdown(3s) + cheers(.8s) section
            setTimeout(function(){
                socket.emit("start");
            }, 7000)
        } else if (players.length === 0) {
            //both exit, then show login page
            location.reload();
        }
    }

    function startGame(){
        console.log("Game starts");
        currentStatus = GameStatus.PLAYING;
        $(".step2").hide();
        $(".step3").hide();
        $(".step4").show();
        $(".step4 .avatar_left").css("background-image", "url(" + onlinePlayers[0].headPortrait + ")");
        $(".step4 .avatar_right").css("background-image", "url(" + onlinePlayers[1].headPortrait + ")");
        $(".role_left").addClass("role_left_ingame");
        $(".role_right").addClass("role_right_ingame"); 
    }

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
        $(".score_"+side).velocity({width: scoreBarWidth},{duration:100,easing: "linear"});

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


    function reward(winner){
        currentStatus = GameStatus.REWARDING;
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
    }

    /*
    param:
        type: Exit or Enter
        img: avatar url
        name: player name
    */
    function showToast(img, type, name){
        var msg = "";

        if(type.toUpperCase() === "EXIT") {
            msg = "离开游戏"
        } else if (type.toUpperCase() === "ENTER"){
            msg = "进入游戏"
        } else {
            return;
        }

        var $toastInstance = $(".toast_template").clone();
        $toastInstance.removeClass("toast_template");
        $toastInstance.children(".avatar").css("background-image", "url(" + img + ")");
        $toastInstance.children(".info").children(".infoMsg").text(msg);
        $toastInstance.children(".info").children(".playerName").text(name);
        $(".toast:not('.toast_template')").remove();
        $(".kiosk-wrap").append($toastInstance);
        $toastInstance.velocity({
            opacity:1
        },{
            duration: 300,
            easing:"ease-in"
        }).velocity({
            opacity:0
        },{
            delay: 2000,
            duration: 300,
            easing: "ease-out"
        });
    }

    $(".btn_ad_close").one("click", function(){
        $(this).parent().hide();
    });

})