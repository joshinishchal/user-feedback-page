var feedbackApp = angular.module("feedbackApp", ["ngResource", "firebase"]);

feedbackApp.constant("FirebaseUrl", "https://netpulse-feedback.firebaseio.com");

feedbackApp.constant("ChainName", "Three Rivers");

feedbackApp.constant("ClubId" , "27b30fad-c756-4d96-afe0-6d3cb0ebc425");

feedbackApp.constant("OverViewKey", "0000");

feedbackApp.service("rootRef", ["FirebaseUrl", Firebase]);

feedbackApp.service("club", function club(rootRef, $firebaseObject, ChainName, ClubId, OverViewKey) {
	var overView = rootRef.child(ChainName).child(ClubId).child(OverViewKey);
	this.overView = $firebaseObject(overView);
})


feedbackApp.controller("feedbackController", function($scope, club){

	$scope.overView = club.overView;

	$scope.clubInfo = {
		clubName : "California Avenue"
	};
});