$(document).ready(function(){
	var config = {
		gameWS: "http://127.0.0.1:8087/",//http://demowifi.smartac.co:8087
		accountId: "gh_4ffca3361cb7", //微信公众号ID
		srapiurl: "http://srdemo.smartac.co/api/", //SR API地址前缀
    };

    var socket = io(config.gameWS, { query:"role=judge"});
    socket.on("regist", function(user){
    	if(user.userCount ==1) {
    		$(".step1").hide();
            $(".step2").show();
            $(".avatar").css("background-image", "url(" + user.userInfo.HeadPortrait + ")");
            $(".nickname_txt").text(user.userInfo.FullName);
    		console.log(user.userInfo.FullName + " has enter the room, waiting another competitor");
    	} else if (user.userCount == 2) {
    		//begin countdown
            $(".step2").hide();
            $(".step3").show();
            $(".step3").addClass("ani-countdown");
            //display stage section after animation
            setTimeout(function(){
                $(".step3").hide();
                $(".step4").show();
            }, 7000);
    	} else {

    		console.log("Should not get here");
    	}
    })

    socket.on("refresh", function(){
    	$(".avatar*").prop("src","");
    })
})