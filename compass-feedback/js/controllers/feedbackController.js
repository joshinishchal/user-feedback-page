var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase"]);

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
	this.getFeedbackData = function(){
		return $firebaseObject(clubId);
	};
})


feedbackApp.controller("feedbackController", function($scope, club){

	$scope.overView = club.getOverView();

	$scope.feedbackData = club.getFeedbackData();

	$scope.clubInfo = {
		clubName : "California Avenue"
	};
});