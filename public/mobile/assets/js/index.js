$(document).ready(function(){

	var config = {
		gameWS: "http://172.16.5.65:8087/",//test Smartac
		// gameWS: "http://192.168.31.104:8087/",//test iMac
		// gameWS: "http://192.168.31.101:8087/",//test Laptop
		// gameWS: "http://demowifi.smartac.co:8087/",//prd
		accountId: "gh_4ffca3361cb7", //WeChat account ID
		srapiurl: "http://srdemo.smartac.co/api/", //SR API
        };

	// var openid = getWeixinOpenId(); //for production
	var openid = "oNPMJj9yw5SNuNDNQvJAh7nvvxbE"; //only for testing
	var userInfo = {};
	var socket;


	//WeChat JSSDK  for hiding some menu options and close window
	var json = {
	    WeChatID: config.accountId,
	    Url: "http://srdemo.smartac.co:8080/game/mobile/index.html"
	};

	$.post(config.srapiurl+"weiapp/GetJsJDKConfig", json, function (data) {
	    wx.config({
	        debug: false,
	        appId: data.ResultValue.appid,
	        timestamp: data.ResultValue.timestamp,
	        nonceStr: data.ResultValue.nonceStr,
	        signature: data.ResultValue.signature,
	        jsApiList: ["hideOptionMenu","closeWindow"]
	    });
	    //隐藏掉右上角菜单
	    wx.ready(function () {
	        wx.hideOptionMenu();

	        $(".btn_close").on("click", function(){
	        	wx.closeWindow();
	        })
	    })
	})

	//check if player is follower of demowifi
	if(!isFollower()){
	    //alert('请先关注我们的公众号后，重新扫码！');
	    window.location.href='login.html';
	    return;
	} else {
		// socket = io(config.gameWS, { query:"role=competitor"});
	}

	//extract openid from url
	function getWeixinOpenId() {
		var openid = false;
		var searchStr = location.search;
		if (searchStr !== '') {
		    searchStr = searchStr.substr(1);
		    var searchCondition = searchStr.split('&');
		    searchCondition.forEach(function(item) {
		        if (item.indexOf('openid') === 0) {
		            openid = item.split('=')[1];
		        }
		    });
		}
		return openid;
	}

	//check if user follows the public account
	function isFollower(){
	    var result = false;
	    $.ajax({
	        url:  config.srapiurl+ "customer/custvalidate_xc/" + config.accountId + "/" + openid + " ", 
	        dataType: 'json',
	        //contentType: 'application/json',
	        type: 'get',
	        data: {},
	        async: false
	    }).done(function(data) {
	        if (data.code == 1) {
	            result = true;
	        } else {
	            result = false;
	        }
	    });
	    return result;
	}

		//get user account info
	if(openid){
		//query user info via SR API
	    $.ajax({
	        url:  config.srapiurl+ "Customer/CustomerGetById_xc/"+ openid +"/" + config.accountId +"", //Weixin User API
	        dataType: 'json',
	        type: 'get'
	    }).done(function(data) {
	    	if (data != null) {
	    		userInfo["headPortrait"] = data.HeadPortrait;
	    		userInfo["fullName"] = data.FullName;
	    		userInfo["id"] = data.FullName+"_"+(new Date()).getTime().toString().slice(-5);
				userInfo["role"] = "competitor";

				socket = io(config.gameWS, { query:userInfo});
				bindSockEvents(socket);
	    	} else {
	    		console.log("Cannot retrive user info from SR.");
	    	}
	    }).fail( function (error) {
	    	console.error("SR API Internal Error.")
	    });
	} else {
		alert("can not get openid!");
	}

	//get 100 points from SR api
	function getPoints(){
	    var data="'{\"openid\":\""+openid+"\",\"pointnum\":\"100\",\"notes\":\"喝啤酒游戏\"}'";
	    $.ajax({
	        url: config.srapiurl+"RewardsProgram/RewardPointToMember_xc",
	        dataType: 'json',
	        contentType: 'application/json',
	        type: 'post',
	        data: data
	    }).done(function(data) {
	        if (data == 1) {
	        	// alert("领取成功！");
	        	$(".mask").velocity({opacity:0.6}, {display:"block"});
	        	$(".banner").addClass("banner_success");
	        	$(".step5 .btn_close").velocity({opacity:1}, {display:"block"});
	            return true;
	        } else {
	        	alert("领取失败！");
	            return false;
	            console.error(data);
	        }
	    });
	}


	//bind for get point reward
	$(".btn_get_point").one("click", getPoints);


	//define event handler for shake
	var SHAKE_THRESHOLD = 3000;
	var last_update = 0;
	var last_x = last_y = last_z = 0;
	function deviceMotionHandler(eventData) {
	    var acceleration = eventData.accelerationIncludingGravity;
	    var curTime = new Date().getTime();
	 
	 	if ((curTime - last_update) > 100) {
	    var diffTime = curTime - last_update;
	    last_update = curTime;
	        x = acceleration.x;
	        y = acceleration.y;
	        z = acceleration.z;
	        var speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;
	        if (speed > SHAKE_THRESHOLD) {
	            uploadSpeed(speed);
	        }
	        last_x = x;
	        last_y = y;
	        last_z = z;
	    }
	}
	function uploadSpeed(speed){
		socket.emit("score", {id: userInfo.id, score: parseInt(speed)});
	}

	function bindSockEvents(socket){
		socket.on("room full", function() {
			console.log("room is full");
			alert("玩家已满，请稍等");
		})

		//players is an array
		socket.on("sync", syncPlayer);

	    socket.on("start", startGame);

		socket.on("gameover", rewardWinner);
	}

	function syncPlayer(players){
	    	if(players.length ==1) {
	    		//fisrt player enter
	    		$(".role2_waiting").hide();
	    		console.log("1 player, is " + players[0].fullName)
	    	} else if (players.length == 2) {
	    		//second player

	    		if(players[1].id === userInfo.id) {
	    			$(".role1_waiting").hide();
	    			$(".role2_waiting").show();
	    		}

	    		console.log("2 players, they are " + players[0].fullName + " and " + players[1].fullName);
	    		console.log("Let's countdown!");

	    		//countdown animation
				var countdownShow = {
		            p: {
		              opacity: 1,
		              scale: 0.5
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

		        //delay 2s for waiting kiosk display two players info
		        var loadingSequence = [
		            { e: $(".mask"), p: {opacity:0.6}, o: {display:"block", delay:2000}},
		            { e: $(".countdown_3"), p: countdownShow.p, o: countdownShow.o},
		            { e: $(".countdown_3"), p: countdownHide.p, o: countdownHide.o},
		            { e: $(".countdown_2"), p: countdownShow.p, o: countdownShow.o},
		            { e: $(".countdown_2"), p: countdownHide.p, o: countdownHide.o},
		            { e: $(".countdown_1"), p: countdownShow.p, o: countdownShow.o},
		            { e: $(".countdown_1"), p: countdownHide.p, o: countdownHide.o},
		            { e: $(".mask"), p: {opacity:0}, o: {display:"none"}}
		        ]

		        //about 5 seconds
		        $.Velocity.RunSequence(loadingSequence);

	    		//show cheers section when countdown ends
	    		setTimeout(function(){
	    			$(".step1").hide();
	    			$(".step2").hide();
	    			$(".step3").show();
	    			//animation for cheers
						$('.left-beer').velocity({
						    left:"50%", 
						    marginLeft:"-50px",
						    scale:"1.2",
						    rotateZ:"-15deg"
						},{
						    duration: 800,
						    easing: [0.32,0,0.68,1.31]
						});
						$('.right-beer').velocity({
						    right:"15%",
						    marginLeft:"-40px",
						    scale:"1.2",
						    rotateZ:"15deg"
						},{
						    duration: 800,
						    easing: [0.32,0,0.68,1.31]
						});
						$('.go').velocity({
						    opacity: 1,
						    scale:"1.2"
						},{
						    duration: 800,
						    easing: [0.32,0,0.68,1.31]
						});
						$('.foam').velocity({
						    opacity: 1,
						    top: "170px",
						    scale: "1.2"
						},{
						    duration: 200,
						    easing: [0.32,0,0.68,1.31],
						    delay: 600
						})
	    		},5000);
	    	}
	    }

	    function startGame(players){
	    	console.log("Game starts")
	    	$(".step3").hide();
	    	$(".step4").show();

	    	//avatar to indicate player's role
	    	var imgSrc;
	    	if(players.playersList[1].id === userInfo.id) {
	    		imgSrc = "./assets/img/role_1.png";
	    	} else {
	    		imgSrc = "./assets/img/role_2.png";
	    	}

	    	$(".in-game .avatar img").attr("src", imgSrc);

	    	//make hand shake
	    	$(".hand").velocity({
	    		rotateZ: "30deg"
	    	},{
	    		duration: 500,
	    		easing: "ease",
	    		loop: true
	    	});

			//listen shake event
			if (window.DeviceMotionEvent) {
			    window.addEventListener('devicemotion', deviceMotionHandler, false);
			} else {
			    alert('您的手机不支持此游戏，换个新的吧~');
			}
		}

	function rewardWinner(winner){
			//remove shake listener
			window.removeEventListener('devicemotion', deviceMotionHandler, false);

			if(winner.winnerId === userInfo.id){
				//current player win
				$(".step4").hide();
				$(".result_win").show();
			} else {
				//current player lose
				$(".step4").hide();
				$(".step5").hide();
				$(".result_lose").show();
			}
		}

	$(".btn_ad_close").one("click", function(){
		$(this).parent().hide();
	})

})