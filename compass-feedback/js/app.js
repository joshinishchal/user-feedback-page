var np = np || {};

np.brand = 'netpulse';

np.routes = {};

// routes that don't require authorisation
np.noAuthRoutes = [];

np.noAuthViews = $.map(np.noAuthRoutes, function (route) {
    return route.split('/')[1];
});

np.routeDependencies = {};

// private pages
np.pages = {};

np.apiPathPrefix = '/np';

np.app = angular.module('np.app', [
    'np.app.filters', 'np.app.services', 'np.app.directives', 'np.app.analytics'
]).config(['$httpProvider', '$routeProvider', function ($httpProvider, $routeProvider) {}]);

angular.module('np.app.branding', ['np.app.utils']);
