var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase", "ngclipboard", "ui.bootstrap"]);

feedbackApp.constant("FirebaseUrl", "https://netpulse-feedback.firebaseio.com");

feedbackApp.constant("ChainName", "Three Rivers");

feedbackApp.constant("ClubId" , "27b30fad-c756-4d96-afe0-6d3cb0ebc425");

feedbackApp.constant("OverViewKey", "0000");

feedbackApp.service("rootRef", ["FirebaseUrl", Firebase]);

feedbackApp.service("club", function club(rootRef, $firebaseObject, ChainName, ClubId, OverViewKey) {
	var clubId = rootRef.child(ChainName).child(ClubId);
	var overView = clubId.child(OverViewKey);
	//var feedBack = 
	this.getOverView = function() {
		return $firebaseObject(overView);
	};
	this.getAllData = function(index){
		return $firebaseObject(clubId.limitToLast(index));
	};
})


feedbackApp.controller("feedbackController", function($scope, club, OverViewKey){

	$scope.OverViewKey = OverViewKey;
	$scope.daysTobeViewed = 1;

	$scope.overView = club.getOverView();

	$scope.allData = club.getAllData($scope.daysTobeViewed);

	$scope.getMoreData = function(){
		$scope.daysTobeViewed++;
		$scope.allData = club.getAllData($scope.daysTobeViewed);
	};

	$scope.callText = "Call";
	$scope.emailText = "Email";

	$scope.getPhoneText = function(feedbackPhone, defaultPhoneText){
		var phoneText = defaultPhoneText;
		if(feedbackPhone && feedbackPhone != ""){
			phoneText = feedbackPhone;
		}
		return phoneText;
	};

	$scope.getEmailText = function(feedbackEmail, defaultEmailText){
		var emailText = defaultEmailText;
		if(feedbackEmail && feedbackEmail != ""){
			emailText = feedbackEmail;
		}
		return emailText;
	};

	$scope.getReasons = function(reason1,reason2,reason3,reason4,reason5,reason6){

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

	$scope.isThereNoComment = function(length){
		if (length > 0) {
			return false;
		}else{
			return true;
		}
	};

	$scope.getVisitedDateObject = function(str){
		//"04/27/2016 15:32:53 PDT"
		//new Date(year, month, day, hours, minutes, seconds, milliseconds)
		//fullDate or EEEE, MMMM d
		var date = str.split(" ")[0].split("/");

		return new Date(date[2], date[0] - 1, date[1]);
	};

	$scope.getDateObject = function(str){
		var dateArray = str.split("-");
		return new Date(dateArray[0],dateArray[1]-1,dateArray[2]);
	};

	$scope.clubInfo = {
		clubName : "California Avenue"
	};
});