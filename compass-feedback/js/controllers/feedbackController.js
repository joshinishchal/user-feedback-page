var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase", "ngRoute", "cgBusy", "ngAnimate"]);

feedbackApp.value('cgBusyDefaults',{
	message:'Loading',
	//backdrop: false,
	/*templateUrl: 'my_custom_template.html',*/
	delay: 0,
	minDuration: 700,
	wrapperClass: 'centerAbsoluteEl'
});

feedbackApp.constant("FirebaseUrl", "https://nischal-test.firebaseio.com");
feedbackApp.constant("ReportUrl", "https://nischal-report-test.firebaseio.com");

feedbackApp.constant("OverViewKey", "0000");

feedbackApp.service("rootRef", ["FirebaseUrl", Firebase]);

feedbackApp.factory("feedbackLocation", ["$route", "$routeParams", "$location", function feedbackLocation($route, $routeParams, $location){
	var location = $location.$$path;
	var arr = location.split("/");
	return {
		ChainName : arr[1],
		ClubId : arr[2]
	}

}]);

feedbackApp.factory("reportDates", ["$route", "$routeParams", "$location", function reportDates($route, $routeParams, $location){
	var dates = $location.$$path;
	var arr = dates.split("/");
	return {
		startDate : arr[3],
		endDate : arr[4]
	}

}]);

feedbackApp.service("gaDimensionSender",["feedbackLocation", function gaDimensionSender(feedbackLocation){
	this.sendDimensions = function(){
		if(ga){
			//console.log("GA exists..");
			ga('set', 'dimension1', feedbackLocation.ChainName);
			ga('set', 'dimension2', feedbackLocation.ClubId);
		}else{
			//console.log("GA is not defined yet..");
		}
	};
}]);

feedbackApp.service("club", ["rootRef", "$firebaseArray", "$firebaseObject", "OverViewKey", "feedbackLocation", function club(rootRef, $firebaseArray, $firebaseObject, OverViewKey, feedbackLocation){
	var clubId = rootRef.child(feedbackLocation.ChainName).child(feedbackLocation.ClubId);
	this.getOverView = function() {
		return $firebaseObject(clubId.child(OverViewKey));
	};
	this.getAllData = function(){
		return $firebaseArray(clubId.orderByValue());
	};
	this.getSpecificData = function(index){
		return $firebaseArray(clubId.limitToLast(index));
	};
	this.getFeedbacks = function(date){
		return $firebaseObject(clubId.child(date));
	};
	this.getFeedbackForReview = function(date,feedbackId){
		return $firebaseObject(clubId.child(date).child(feedbackId));
	};
}]);

feedbackApp.service("reportHelper",["$filter", function reportHelper($filter){
	function daysinMonth(month){
		var mdmapper = {
			"01" : 31,
			"02" : 29,
			"03" : 31,
			"04" : 30,
			"05" : 31,
			"06" : 30,
			"07" : 31,
			"08" : 31,
			"09" : 30,
			"10" : 31,
			"11" : 30,
			"12" : 31
		};
		return mdmapper[month];
	}

	this.getDatesArray = function(startDate,endDate){
		var arr = [];
		var date;
		var startArray = startDate.split("-");
		var endArray = endDate.split("-");

		var startDay = parseInt(startArray[2],10);
		var endDay = parseInt(endArray[2],10);

		for(var i = startDay; i<=daysinMonth(startArray[1]); i++){
			date = startArray[0] + "-" + startArray[1] + "-" + $filter("readableDay")(i);
			arr.push(date);
		}

		if(parseInt(endArray[1], 10) - parseInt(startArray[1], 10) > 1){
			var newStartMonth = parseInt(startArray[1], 10) + 1;
			var newEndMonth = parseInt(endArray[1], 10) - 1;
			for(var a=newStartMonth; a <= newEndMonth; a++){
				var readableMonth = $filter("readableDay")(a);
				var tmpDaysInMonth = daysinMonth(readableMonth);
				for(var j=1; j<=tmpDaysInMonth; j++){
					date = endArray[0] + "-" + readableMonth + "-" + $filter("readableDay")(j);
					arr.push(date);
				}
			}

		}

		for(var j=1; j<=endDay; j++){
			date = endArray[0] + "-" + endArray[1] + "-" + $filter("readableDay")(j);
			arr.push(date);
		}
		nj = arr;

		return arr;
	};

}]);

feedbackApp.service("initFbHelper", ["$scope", "fbhelper", function initFbHelper($scope,fbhelper){
	this.init = function(){
		$scope.getTodaysScore = fbhelper.getTodaysScore;
		$scope.getTotalTodaysReviewsText = fbhelper.getTotalTodaysReviewsText;
		$scope.getTotalTodaysReviews = fbhelper.getTotalTodaysReviews;
		$scope.getTotalPrevScore = fbhelper.getTotalPrevScore;
		$scope.hideShowPrevDayButton = fbhelper.hideShowPrevDayButton;

		//Google Analytics
		$scope.reportCallClick = fbhelper.reportCallClick;
		$scope.reportEmailClick = fbhelper.reportEmailClick;

		//All time score
		$scope.getTotalAllTimeReview = fbhelper.getTotalAllTimeReview;
		$scope.getAvgAllTimeScore = fbhelper.getAvgAllTimeScore;

		$scope.getPhoneText = fbhelper.getPhoneText;
		$scope.getEmailText = fbhelper.getEmailText;
		$scope.isPhoneEmailAvailable = fbhelper.isPhoneEmailAvailable;
		$scope.getReasons = fbhelper.getReasons;
		$scope.isThereNoComment = fbhelper.isThereNoComment;
		$scope.getVisitedDateObject = fbhelper.getVisitedDateObject;
		$scope.getDateObject = fbhelper.getDateObject;
		$scope.getStarBGClass = fbhelper.getStarBGClass;
	}
}]);

feedbackApp.service("fbhelper", ["$filter", "OverViewKey", "gaDimensionSender", function fbhelper($filter, OverViewKey, gaDimensionSender){

	var _totalTodaysScore = 0;
	var _totalTodaysReviews = 0;
	var _overViewFlag = false;

	this.getPhoneText = function(feedbackPhone, defaultPhoneText){
		var phoneText = defaultPhoneText;
		if(feedbackPhone && feedbackPhone != ""){
			phoneText = $filter('tel')(feedbackPhone);
		}
		return phoneText;
	};

	this.getEmailText = function(feedbackEmail, defaultEmailText){
		var emailText = defaultEmailText;
		if(feedbackEmail && feedbackEmail != ""){
			emailText = feedbackEmail;
		}
		return emailText;
	};

	this.reportCallClick = function(reviewTime, userUUID){
		ga('set','userId',ga.clientId);
		gaDimensionSender.sendDimensions();
		ga('set', 'dimension3', userUUID);
		//console.log("Click ResponseTime: " + getResponseTime(reviewTime));
		ga('send','event','Web Club 360 Response', 'called-customer-from-web',ga.clientId,getResponseTime(reviewTime));
	};

	this.reportEmailClick = function(reviewTime, userUUID){
		ga('set','userId',ga.clientId);
		gaDimensionSender.sendDimensions();
		ga('set', 'dimension3', userUUID);
		ga('send','event','Web Club 360 Response', 'emailed-customer-from-web',ga.clientId,getResponseTime(reviewTime));
	};

	function getResponseTime(reviewTime){
		//Returns time in minutes.
		var reviewDate = getDateObjectFromMT(reviewTime);
		var today = new Date();
		var responseTime = today - reviewDate;
		var minuteConversion = 60000;
		if(responseTime <= 60000){
			return 1
		}else{
			return Math.round(responseTime/minuteConversion);
		}
		return 10;
	}

	this.isPhoneEmailAvailable = function(phoneEmail){
		if(phoneEmail == "undefined" || phoneEmail == null || phoneEmail == "" || phoneEmail.replace(/ /g,"") == ""){
			return false;
		}else{
			return true;
		}
	};



	this.getReasons = function(reason1,reason2,reason3,reason4,reason5,reason6){

		var reasons = reason1;
		reasons = addReasons(reasons,reason2);
		reasons = addReasons(reasons,reason3);
		reasons = addReasons(reasons,reason4);
		reasons = addReasons(reasons,reason5);
		reasons = addReasons(reasons,reason6);
		return reasons;

	};

	function addReasons(reasons,newReason){
		var joiningString = "";

		if(reasons != ""){
			joiningString = ",";
		}

		if(newReason != ""){
			return reasons + joiningString + newReason;
		}else{
			return reasons;
		}
	}

	this.isThereNoComment = function(length){
		if (length > 0) {
			return false;
		}else{
			return true;
		}
	};

	this.getVisitedDateObject = function(str){
		return getDateObjectFromMT(str);
	};

	function getDateObjectFromMT(str){
		//"04/27/2016 15:32:53 PDT"
		//new Date(year, month, day, hours, minutes, seconds, milliseconds)
		//fullDate or EEEE, MMMM d
		var dateObj = str.split(" ");
		var date = dateObj[0].split("/");
		var time = dateObj[1].split(":");
		var timeZone = dateObj[2];

		return new Date(date[2], date[0] - 1, date[1], time[0], time[1], time[2]);
	}

	this.getDateObject = function(str){
		var dateArray = str.split("-");
		return new Date(dateArray[0],dateArray[1]-1,dateArray[2]);
	};

	this.getTodaysScore = function(obj){
		_totalTodaysScore = 0;
		_totalTodaysReviews = 0;
		var todaysReviewsAndScore;

		if(obj.length >= 1 && obj[obj.length - 1].$id == $filter("date")(new Date(), "yyyy-MM-dd")){
			todaysReviewsAndScore = getDaysReviesAndScore(obj[obj.length - 1]);
			_totalTodaysScore = todaysReviewsAndScore.totalScore;
			_totalTodaysReviews = todaysReviewsAndScore.totalReviews;
		}

		if(_totalTodaysReviews == 0){
			return "--";
		}else{
			return $filter("number")(_totalTodaysScore/_totalTodaysReviews, 1);
		}
	};

	this.getTotalPrevScore = function(overViewObj, allDataObj){

		var daysTotalReviewsAndTotalScore;
		var todaysDate = $filter("date")(new Date(), "yyyy-MM-dd");
		var lastReviewDate;
		var totalPrevScore = 0;
		var totalPrevReviews = 0;

		if(overViewObj.lastReviewDate == todaysDate){
			totalPrevScore = overViewObj.totalRating;
			totalPrevReviews = overViewObj.totalReviews;
			return;
		}else{
			totalPrevScore = 0;
			totalPrevReviews = 0;
		}

		if(!overViewObj.lastReviewDate){
			overViewObj.lastReviewDate = "";
		}

		if(!overViewObj.totalRating){
			overViewObj.totalRating = "";
		}

		if(!overViewObj.totalReviews){
			overViewObj.totalReviews = "";
		}

		lastReviewDate = overViewObj.lastReviewDate;

		if(lastReviewDate == "" || lastReviewDate != todaysDate){
			_overViewFlag = true;
			lastReviewDate = todaysDate;
			angular.forEach(allDataObj, function(value,key){
				if(value.$id != OverViewKey && value.$id != todaysDate){
					daysTotalReviewsAndTotalScore = getDaysReviesAndScore(value);
					totalPrevScore = totalPrevScore + daysTotalReviewsAndTotalScore.totalScore;
					totalPrevReviews = totalPrevReviews + daysTotalReviewsAndTotalScore.totalReviews;
					daysTotalReviewsAndTotalScore = null;
				}
			});
		}

		overViewObj.lastReviewDate = lastReviewDate;
		overViewObj.totalRating = totalPrevScore;
		overViewObj.totalReviews = totalPrevReviews;
	}

	this.hasOverViewNodeChanged = function(){
		return _overViewFlag;
	};

	function getDaysReviesAndScore(feedbackObj){
		var totalScore = 0;
		var totalReviews = 0;
		angular.forEach(feedbackObj, function(value,key){
			if(typeof value == "object" && value != null){
				totalScore = totalScore + parseInt(value.rating,10);
				totalReviews = totalReviews + 1;
			}
		});
		return {"totalScore" : totalScore, "totalReviews" : totalReviews};
	}

	this.getTotalTodaysReviews = function(){
		return _totalTodaysReviews;
	};

	this.getTotalTodaysReviewsText = function(){
		if(_totalTodaysReviews > 0){
			return "from " + _totalTodaysReviews + " reviews";
		}else{
			return "no new review";
		}
	};

	this.getTotalAllTimeReview = function(overViewObj){
		return overViewObj.totalReviews + _totalTodaysReviews;
	};

	this.getAvgAllTimeScore = function(overViewObj){
		if(overViewObj.totalReviews + _totalTodaysReviews > 0){
			return $filter("number")((overViewObj.totalRating + _totalTodaysScore)/(overViewObj.totalReviews + _totalTodaysReviews), 1);
		}else{
			return "--";
		}
	};

	this.getStarBGClass = function(numOfStars){
		if(numOfStars >= 4){
			return "bg-success";
		}else{
			return "bg-danger";
		}
	};

	this.hideShowPrevDayButton = function(daysTobeViewed, allDataObj){
		if(allDataObj.length <= 1){
			return true;
		}else if(daysTobeViewed == allDataObj.length - 1){
			return true;
		}else{
			return false;
		}

	}

}]);

feedbackApp.filter("readableDay", function(){
	return function(day){
		if(day <= 9){
			return "0" + day;
		}else{
			return day;
		}
	};
});

feedbackApp.filter('tel', function(){
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '-' + number.slice(3);

        return (country + " (" + city + ") " + number).trim();
    };
});

feedbackApp.controller("reportController", ["$scope", "club", "fbhelper", "reportHelper", "OverViewKey", "gaDimensionSender", "feedbackLocation", "reportDates", function($scope, club, fbhelper, reportHelper, OverViewKey, gaDimensionSender, feedbackLocation, reportDates){
	$scope.rootNode = {};
	$scope.reportFeedbacks = {};
	$scope.brandName = feedbackLocation.ChainName;
	$scope.locationUUID = feedbackLocation.ClubId;
	$scope.startDate = reportDates.startDate;
	$scope.endDate = reportDates.endDate;
	$scope.reportId;

	var totalReviewsLoaded = 0;
	var uniqueUsers = {};
	var latestReportId = 0;
	var trends = [];
	var happyCustomers = {};
	var unHappyCustomers = {};
	var datesArray = reportHelper.getDatesArray($scope.startDate,$scope.endDate);
	var allFeedbacks = [];
	$scope.locationName = "Nerang";

	/*remove it*/
		$scope.callText = "Call";
		$scope.emailText = "Email";
		$scope.overView = club.getOverView();
		$scope.getTodaysScore = fbhelper.getTodaysScore;
		$scope.getTotalTodaysReviewsText = fbhelper.getTotalTodaysReviewsText;
		$scope.getTotalTodaysReviews = fbhelper.getTotalTodaysReviews;
		$scope.getTotalPrevScore = fbhelper.getTotalPrevScore;
		$scope.hideShowPrevDayButton = fbhelper.hideShowPrevDayButton;

		//Google Analytics
		$scope.reportCallClick = fbhelper.reportCallClick;
		$scope.reportEmailClick = fbhelper.reportEmailClick;

		//All time score
		$scope.getTotalAllTimeReview = fbhelper.getTotalAllTimeReview;
		$scope.getAvgAllTimeScore = fbhelper.getAvgAllTimeScore;

		$scope.getPhoneText = fbhelper.getPhoneText;
		$scope.getEmailText = fbhelper.getEmailText;
		$scope.isPhoneEmailAvailable = fbhelper.isPhoneEmailAvailable;
		$scope.getReasons = fbhelper.getReasons;
		$scope.isThereNoComment = fbhelper.isThereNoComment;
		$scope.getVisitedDateObject = fbhelper.getVisitedDateObject;
		$scope.getDateObject = fbhelper.getDateObject;
		$scope.getStarBGClass = fbhelper.getStarBGClass;

	/*remove it*/

	if(reportDates.startDate && reportDates.endDate){
		getReportFeedbacks();
	}

	function getFeedbackTemplate(date,feedbackId,comment){
		return {
			"date" : date,
			"feedbackId" : feedbackId,
			"comment" : comment
		};
	}

	function getReportFeedbacks(){
		for(var i=0; i <= datesArray.length-1; i++){
			if(!$scope.reportFeedbacks[datesArray[i]]){
				$scope.reportFeedbacks[datesArray[i]] = club.getFeedbacks(datesArray[i]);
				var date = datesArray[i];
				$scope.reportFeedbacks[datesArray[i]].$loaded().then(function(){
					totalReviewsLoaded++;
					if(totalReviewsLoaded == datesArray.length){
						identifyUniqueUsers();
					}
				});
			}
		}
	};

	function createRootNode(brand, locationUUID){

		if(!$scope.rootNode[brand]){
			$scope.rootNode[brand] = {};
		}

		if(!$scope.rootNode[brand][locationUUID]){
			$scope.rootNode[brand][locationUUID] = {
														"reports" : [],
														"detailedReports" : {}
													};
		}
	}

	function publishReport(){
		$scope.reportId = ++latestReportId;
		var detailedReport = {
			"trends" : trends,
			"happyCustomers" : happyCustomers,
			"unHappyCustomers" : unHappyCustomers,
			"uniqueUsers" : uniqueUsers,
			"allFeedbacks" : allFeedbacks
		};

		var reportSummary = {
			"startDate" : datesArray[0],
			"endDate" : datesArray[datesArray.length-1],
			"reportId" : $scope.reportId
		};

		createRootNode($scope.brandName,$scope.locationUUID);

		$scope.rootNode[$scope.brandName][$scope.locationUUID]["reports"].push(reportSummary);
		$scope.rootNode[$scope.brandName][$scope.locationUUID]["detailedReports"][$scope.reportId] = detailedReport;
	}

	function getUserTemplate(firstName, lastName, email, phone, gender){
		return {
			"user_first_name" : firstName,
			"user_last_name" : lastName,
			"user_email" : email,
			"user_phone:" : phone,
			"user_gender" : gender,
			"ratings" : [],
			"feedbacks" : []
		};
	};

	function getFeedbackObj(date, feedbackId){
		return {
			"date" : date,
			"feedbackId" : feedbackId
		};
	};

	function generateUserReport(){
		var trend, trendType, arrSize;

		angular.forEach(uniqueUsers, function(ratingArray,uuid){
			trend = 0;
			trendType = null;
			arrSize = ratingArray["ratings"].length;
			for(var i = arrSize-1; i >=0; i--){
				//console.log("Ratings: " + ratingArray["ratings"][i]);
				if(trendType == null && ratingArray["ratings"][i] >= 4){
					trendType = "positive";
				}else if(trendType == null && ratingArray["ratings"][i] <= 3){
					trendType = "negative";
				}else if(trendType == "positive" && ratingArray["ratings"][i] <= 3){
					break;
				}else if(trendType == "negative" && ratingArray["ratings"][i] >= 4){
					break;
				}

				if(trendType == "positive"){
					trend++;
				}else{
					trend--;
				}
			}

			// //Fake data. For Test only
			// if(trend == 5){
			// 	trend = -5;
			// 	trendType = "negative";
			// }

			if(trendType == "positive"){
				if(!happyCustomers[trend]){
					happyCustomers[trend] = [];
					trends.push(trend);
				}
				happyCustomers[trend].push(uuid);
			}else{
				if(!unHappyCustomers[trend]){
					unHappyCustomers[trend] = [];
					trends.push(trend);
				}
				unHappyCustomers[trend].push(uuid);
			}
		});

		trends.sort().reverse();
		publishReport();
	}


	function identifyUniqueUsers(){
		angular.forEach($scope.reportFeedbacks, function(value, key){
			var date = key;
			//console.log("key: " + key + " , length: " + value.length);

			angular.forEach(value, function(value,key){
				var feedbackId = key;
				// console.log("key: " + key);//index: 0, 1
				// console.log("value : " + value.$id);
				var exerciserUUID = value["netpulse_exerciser_UUID"];
				//console.log("uuid: " + exerciserUUID);

				if(!uniqueUsers[exerciserUUID]){
					uniqueUsers[exerciserUUID] = getUserTemplate(value["user_first_name"],value["user_last_name"],value["user_email"],value["user_phone"],value["user_gender"]);
				}

				uniqueUsers[exerciserUUID]["ratings"].push(value.rating);
				uniqueUsers[exerciserUUID]["feedbacks"].push(getFeedbackObj(date,feedbackId));
				if(value["comment"] != ""){
					allFeedbacks.push(getFeedbackTemplate(date,feedbackId,value["comment"]));
				}
			});
		});

		generateUserReport();
	}
	nishchal = $scope.rootNode;
	rf = $scope.reportFeedbacks;
}]);

feedbackApp.controller("feedbackController", ["$scope", "club", "OverViewKey", "gaDimensionSender", "initFbHelper", function($scope, club, OverViewKey, gaDimensionSender, initFbHelper){
	$scope.OverViewKey = OverViewKey;
	$scope.daysTobeViewed = 1;
	$scope.npFeedbacks = {};
	$scope.callText = "Call";
	$scope.emailText = "Email";
	initFbHelper.init();

	$scope.overView = club.getOverView();

	$scope.allData = club.getAllData();

	$scope.cgBusyPromise = [$scope.overView.$loaded(), $scope.allData.$loaded()];

	gaDimensionSender.sendDimensions();

	$scope.getFeedbacks = function(date){
		if(!$scope.npFeedbacks[date]){
			$scope.npFeedbacks[date] = club.getFeedbacks(date);
		}
		return $scope.npFeedbacks[date];
	};

	$scope.getMoreData = function(){
		ga('set','userId',ga.clientId);
		gaDimensionSender.sendDimensions();
		ga('send','event','Web Club 360 View Tickets', 'viewed-previous-day-from-web',ga.clientId,$scope.daysTobeViewed);
		$scope.daysTobeViewed++;
		//$scope.allData = club.getAllData($scope.daysTobeViewed);
	};

	$scope.allData.$loaded().then(function(){
		$scope.getTotalPrevScore($scope.overView,$scope.allData);
		if(fbhelper.hasOverViewNodeChanged()){
			$scope.overView.$save().then(function(){
				//console.log("successfully updated overview node");
			},function(error){
				//console.log("Error: Could not update overView node. ",error);
			});
		}
	});
}]);