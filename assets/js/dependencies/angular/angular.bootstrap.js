(function() {
		
	/**
	 * Fetch essential user data and posts before loading application at the end
	 * @type {[type]}
	 */
	var BootstrapInit = angular.module('BootstrapInit', [])
	var initInjector = angular.injector(['ng']);
	var $http = initInjector.get('$http');

	// fetch session
	$http.get('/images/logo.png').then(function(response) {

		// bootstrap the app
		angular.element(document).ready(function() {

			var app = 'Raiblocks';

			angular.module(app).value('Logo', response.data);
			angular.bootstrap(document, [app]);
		});
		
	});
})();