$(document).ready(function(){
	var config = {
		gameWS: "http://127.0.0.1:8087/",//http://demowifi.smartac.co:8087
		accountId: "gh_4ffca3361cb7", //微信公众号ID
		srapiurl: "http://srdemo.smartac.co/api/", //SR API地址前缀
    };

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

    		//begin countdown

            setTimeout(function(){
                $(".step2").hide();
                $(".step3").show().addClass("ani-countdown");
            }, 2000);

            setTimeout(function(){
                socket.emit("start");
            }, 8000)
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

    socket.on("start", function(){
        console.log("Game starts");
    })
})