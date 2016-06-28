var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase", "ngRoute"]);

feedbackApp.constant("FirebaseUrl", "https://netpulse-feedback.firebaseio.com");

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

feedbackApp.service("fbhelper", ["$filter", "OverViewKey", function fbhelper($filter, OverViewKey){

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
		//"04/27/2016 15:32:53 PDT"
		//new Date(year, month, day, hours, minutes, seconds, milliseconds)
		//fullDate or EEEE, MMMM d
		var date = str.split(" ")[0].split("/");

		return new Date(date[2], date[0] - 1, date[1]);
	};

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
					console.log("new value.$id: " + value.$id);
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

feedbackApp.controller("feedbackController", ["$scope", "club", "fbhelper", "OverViewKey", function($scope, club, fbhelper, OverViewKey){
	$scope.OverViewKey = OverViewKey;
	$scope.daysTobeViewed = 1;
	$scope.npFeedbacks = {};

	$scope.overView = club.getOverView();

	$scope.allData = club.getAllData();

	$scope.getFeedbacks = function(date){
		if(!$scope.npFeedbacks[date]){
			$scope.npFeedbacks[date] = club.getFeedbacks(date);
		}
		return $scope.npFeedbacks[date];
	};

	$scope.getTodaysScore = fbhelper.getTodaysScore;
	$scope.getTotalTodaysReviewsText = fbhelper.getTotalTodaysReviewsText;
	$scope.getTotalTodaysReviews = fbhelper.getTotalTodaysReviews;
	$scope.getTotalPrevScore = fbhelper.getTotalPrevScore;
	$scope.hideShowPrevDayButton = fbhelper.hideShowPrevDayButton;

	//All time score
	$scope.getTotalAllTimeReview = fbhelper.getTotalAllTimeReview;
	$scope.getAvgAllTimeScore = fbhelper.getAvgAllTimeScore;

	$scope.getMoreData = function(){
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

	$scope.allData.$loaded().then(function(){
		$scope.getTotalPrevScore($scope.overView,$scope.allData);
		if(fbhelper.hasOverViewNodeChanged()){
			$scope.overView.$save().then(function(){
				console.log("successfully updated overview node");
			},function(error){
				console.log("Error: Could not update overView node. ",error);
			});
		}
	});
}]);