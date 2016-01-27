$(document).ready(function(){

	var config = {
		gameWS: "http://127.0.0.1:8087/",//http://srdemo.smartac.co:8087
		accountId: "gh_4ffca3361cb7", //微信公众号ID
		srapiurl: "http://srdemo.smartac.co/api/", //SR API地址前缀
        };
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

	var openid = getWeixinOpenId(); //for production
	// var openid = "oNPMJj9yw5SNuNDNQvJAh7nvvxbE"; //only for testing
	var userInfo = {};
	var socket = io(config.gameWS, { query:"role=competitor"});

	// socket.emit("regist", {HeadPortrait:"myAvatar.png", FullName: "usr_" + (new Date()).getTime().toString().slice(-5)});

	socket.on("room full", function() {
		console.log("room is full");
	})

	socket.on("regist",  function(user){
    	if(user.userCount ==1) {
    		// $(".step").hide();
    		// $(".step1").show();
    		$(".user_avatar1").prop("src", user.userInfo.HeadPortrait);
    		$(".user_name").text(user.userInfo.FullName);
    	} else if (user.userCount == 2) {
    		console.log("Let's countdown!");

    	}
    })

    socket.on("refresh", function() {
    	socket.emit("regist", userInfo);
    });

	//now i can request the user 

	//get user account info
	if(openid){
		$("#openid").text(openid);

		//query user info via SR API
	    $.ajax({
	        url:  config.srapiurl+ "Customer/CustomerGetById_xc/"+ openid +"/" + config.accountId +"", //Weixin User API
	        dataType: 'json',
	        //contentType: 'application/json',
	        type: 'get',
	        async: false
	    }).done(function(data) {
	    	if (data != null) {
	    		userInfo["HeadPortrait"] = data.HeadPortrait;
	    		userInfo["FullName"] = data.FullName;
				socket.emit("regist", userInfo);
	    	} else {
	    		console.log("Cannot retrive user info from SR.");
	    	}
	    }).fail( function (error) {
	    	console.log("SR API Internal Error.")
	    });
	} else {
		alert("can not get openid!");
	}




})