var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase", "ngRoute", "cgBusy", "ngAnimate"]);

feedbackApp.value('cgBusyDefaults',{
	message:'Loading',
	//backdrop: false,
	/*templateUrl: 'my_custom_template.html',*/
	delay: 0,
	minDuration: 700,
	wrapperClass: 'centerAbsoluteEl'
});

feedbackApp.constant("FirebaseUrl", "https://netpulse-feedback.firebaseio.com");

feedbackApp.constant("ReportURL", "http://np-fbreport.s3-website-us-east-1.amazonaws.com");

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

feedbackApp.factory("daysinMonth", [function daysinMonth(){
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

	return {"getDays" : function(month){
				return mdmapper[month];
			}
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
		return $firebaseArray(clubId.child(date));
	};
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

feedbackApp.service("fbhelper", ["$filter", "OverViewKey", "gaDimensionSender", "ReportURL", "feedbackLocation", "daysinMonth", function fbhelper($filter, OverViewKey, gaDimensionSender, ReportURL, feedbackLocation, daysinMonth){

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

	this.thisWeekReportClick = function(){
		ga('set','userId',ga.clientId);
		gaDimensionSender.sendDimensions();
		ga('send','event','Web Club 360 View Tickets', 'opened-web-this-week-report',ga.clientId,1);
	}

	this.lastWeekReportClick = function(){
		ga('set','userId',ga.clientId);
		gaDimensionSender.sendDimensions();
		ga('send','event','Web Club 360 View Tickets', 'opened-web-this-week-report',ga.clientId,1);
	}

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

	function getBaseReportURL(){
		var thisWeekReportURL = ReportURL + "/#/" + feedbackLocation.ChainName + "/" + feedbackLocation.ClubId + "/";
		return thisWeekReportURL;
	}

	this.getThisWeekReportURL = function(){
		//console.log("baseReportURL: " + getBaseReportURL() + _thisWeekReportStartDate + "/" + _thisWeekReportEndDate + "/");
		return getBaseReportURL() + _thisWeekReportStartDate + "/" + _thisWeekReportEndDate + "/";
	}

	this.getLastWeekReportURL = function(){
		//console.log("baseReportURL: " + getBaseReportURL() + _lastWeekReportStartDate + "/" + _lastWeekReportEndDate + "/");
		return getBaseReportURL() + _lastWeekReportStartDate + "/" + _lastWeekReportEndDate + "/";
	}

	var _thisWeekReportStartDate,
	_thisWeekReportEndDate,
	_lastWeekReportStartDate,
	_lastWeekReportEndDate;

	function getReportDates(day){
		//console.log("days: " + daysinMonth.getDays("07"));
		var todayDay = day.getDay();
		var endDate = null;
		var totalDays = null;
		var reportStartDate = null;
		var reportEndDate = null;
		reportEndDate = day.getFullYear() + "-" + $filter("readableDay")(day.getMonth() + 1) + "-" + $filter("readableDay")(day.getDate());
		if(todayDay == 1){
			reportStartDate = reportEndDate;
			//start and end day is the same
		}else{
			if(todayDay == 0){
				//day = 7
				todayDay = 7;
			}

			if((day.getDate() - (todayDay - 1)) >= 1){
				reportStartDate = day.getFullYear() + "-" + $filter("readableDay")(day.getMonth() + 1) + "-" + $filter("readableDay")(day.getDate() - (todayDay - 1));
			}else{
				//write a for loop here..
				todayDay = todayDay - 1 - day.getDate();
				totalDays = daysinMonth.getDays($filter("readableDay")(day.getMonth() + 1 - 1));// +1 is to convert it to right month, and -1 is to decrease it by a month
				console.log("totalDays: " + totalDays);
				endDate = totalDays - todayDay;
				console.log("endDate: " + endDate);

				reportStartDate = day.getFullYear() + "-" + $filter("readableDay")(day.getMonth() + 1 - 1) + "-" + $filter("readableDay")(endDate);
			}

		}

		return {"startDate" : reportStartDate, "endDate" : reportEndDate};
	}

	function findLastWeekDate(thisWeekStartDate){
		//"08/17/2016"
		var lastWeekEndDate = null;
		var tmpDate = parseInt(thisWeekStartDate.split("-")[2],10);
		var tmpMonth = parseInt(thisWeekStartDate.split("-")[1],10);
		tmpDate  = tmpDate - 1;
		if(tmpDate >= 1){
			lastWeekEndDate = tmpDate;
		}else{
			tmpMonth = tmpMonth - 1;
			tmpDate = daysinMonth.getDays($filter("readableDay")(tmpMonth));
		}
		lastWeekEndDate = tmpMonth + "/" + tmpDate + "/" + thisWeekStartDate.split("-")[0];
		return lastWeekEndDate;
	}
	//generateThisWeekDates

	this.generateReportDates = function(){
		var reportDates = getReportDates(new Date());
		var lastWeekEndDate = null;
		_thisWeekReportStartDate = reportDates.startDate;
		_thisWeekReportEndDate = reportDates.endDate;
		//console.log("ThisWeekStartDate: " + _thisWeekReportStartDate);
		//console.log("ThisWeekEndDate: " + _thisWeekReportEndDate);

		lastWeekEndDate = findLastWeekDate(_thisWeekReportStartDate);
		reportDates = getReportDates(new Date(lastWeekEndDate));


		_lastWeekReportStartDate = reportDates.startDate;
		_lastWeekReportEndDate = reportDates.endDate;
		//console.log("LastWeekStartDate: " + _lastWeekReportStartDate);
		//console.log("LastWeekEndDate: " + _lastWeekReportEndDate);
	};

}]);

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

feedbackApp.controller("feedbackController", ["$scope", "club", "fbhelper", "OverViewKey", "gaDimensionSender", function($scope, club, fbhelper, OverViewKey, gaDimensionSender){
	$scope.OverViewKey = OverViewKey;
	$scope.daysTobeViewed = 1;
	$scope.npFeedbacks = {};

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

	fbhelper.generateReportDates();

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

	$scope.getMoreData = function(){
		ga('set','userId',ga.clientId);
		gaDimensionSender.sendDimensions();
		ga('send','event','Web Club 360 View Tickets', 'viewed-previous-day-from-web',ga.clientId,$scope.daysTobeViewed);
		$scope.daysTobeViewed++;
		//$scope.allData = club.getAllData($scope.daysTobeViewed);
	};

	$scope.callText = "Call";
	$scope.emailText = "Email";

	$scope.getPhoneText = fbhelper.getPhoneText;
	$scope.getEmailText = fbhelper.getEmailText;
	$scope.isPhoneEmailAvailable = fbhelper.isPhoneEmailAvailable;
	$scope.getReasons = fbhelper.getReasons;
	$scope.isThereNoComment = fbhelper.isThereNoComment;
	$scope.getVisitedDateObject = fbhelper.getVisitedDateObject;
	$scope.getDateObject = fbhelper.getDateObject;
	$scope.getStarBGClass = fbhelper.getStarBGClass;
	$scope.getThisWeekReportURL = fbhelper.getThisWeekReportURL;
	$scope.getLastWeekReportURL = fbhelper.getLastWeekReportURL;
	$scope.thisWeekReportClick = fbhelper.thisWeekReportClick;
	$scope.lastWeekReportClick = fbhelper.lastWeekReportClick;

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