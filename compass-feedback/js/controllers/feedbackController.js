var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase"]);

feedbackApp.constant("FirebaseUrl", "https://netpulse-feedback.firebaseio.com");

feedbackApp.constant("ChainName", "Goodlife");

feedbackApp.constant("ClubId" , "4d4f01b3-4e7b-4bb8-b528-f18014c0355b");

feedbackApp.constant("OverViewKey", "0000");

feedbackApp.service("rootRef", ["FirebaseUrl", Firebase]);

feedbackApp.service("club", ["rootRef", "$firebaseArray", "$firebaseObject", "ChainName", "ClubId", "OverViewKey", function club(rootRef, $firebaseArray, $firebaseObject, ChainName, ClubId, OverViewKey){
	var clubId = rootRef.child(ChainName).child(ClubId);
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

feedbackApp.service("fbhelper", ["$filter", function fbhelper($filter){

	var _totalTodaysScore = 0;
	var _totalTodaysReviews = 0;

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
		
		if(obj.length >= 1 && obj[obj.length - 1].$id == $filter("date")(new Date(), "yyyy-MM-dd")){
			angular.forEach(obj[obj.length - 1], function(value,key){
				if(typeof value == "object" && value != null){
					_totalTodaysScore = _totalTodaysScore + parseInt(value.rating,10);
					_totalTodaysReviews = _totalTodaysReviews + 1;
				}
			});
		}

		if(_totalTodaysReviews == 0){
			return "--";
		}else{
			return $filter("number")(_totalTodaysScore/_totalTodaysReviews, 1);
		}
	};

	function getDaysRevies(){

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
}]);