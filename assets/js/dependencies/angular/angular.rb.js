(function() {

	// module + dependancies
	angular.module('Raiblocks', [
		'BootstrapInit',
		'vcRecaptcha', 
		'angularPayments',
		'ngRoute'
		])

	// route provider
	.config(function($routeProvider) {

		$routeProvider

		.when('/', {
			templateUrl : 'templates/home.html',
			controller  : 'homeCtrl'
		})

		.when('/start', {
			templateUrl : 'templates/start.html',
			controller  : 'startCtrl'
		})

		.when('/block', {
			templateUrl : 'templates/block.html',
			controller  : 'blockCtrl'
		})

		.when('/faucet', {
			templateUrl : 'templates/faucet.html',
			controller  : 'faucetCtrl'
		})

		.when('/free', {
			templateUrl : 'templates/free.html',
			controller  : 'freeCtrl'
		})

		.when('/purchase', {
			templateUrl : 'templates/purchase.html',
			controller  : 'purchaseCtrl'
		})

		.when('/faucet', {
			templateUrl : 'templates/faucet.html',
			controller  : 'faucetCtrl'
		});
	})

	.run(function($rootScope, $interval, $location, $templateCache, API, Logo, Countdown) {

		// grab logo from bootstrap
		$rootScope.logo = Logo;

		// establish app-wide variables
		$rootScope.price = undefined;
		$rootScope.checkingPrice = false;
		$rootScope.recaptchaKey = '6LcPNAsTAAAAANCpxZY3SMikIjg5a0T9XTnjM-v4';
		$rootScope.faucetNumber = 'SZY2r3dduWuUKPwFbXhCeYetbdSs28zBA157cT6houLE5CunXC';

		// detect route change and do logic (clear template cache, store path in rootScope)
		$rootScope.$on("$locationChangeStart", function(e, newUrl, oldUrl) {

			// find the path and get rid of the trailing slash
			var path = $location.path().replace('/', '');

			// give home a name
			if(path === '') { path = 'home'; }

			// if we are accessing a route that needs auth, let's redirect away(for UX).
			// theoretically, someone could manipulate this but it won't do any good
			// because of server-side checks for all API calls

			// store the path for app-wide use
			$rootScope.path = path;
			// prevent caching of routes templates
			$templateCache.removeAll();
		});
	})

	// readable time filter (currently accepts seconds as a starting point)
	.filter('readableTime', function() {
		return function(rawSeconds) {
			var rawMinutes = rawSeconds / 60;
			var minutes = Math.floor(rawMinutes);
			var remainingSecondsFraction = rawMinutes - minutes;
			var seconds = Math.round(remainingSecondsFraction * 60);
			if(seconds < 10) { seconds = '0'+seconds; }
			return minutes + ':' + seconds;
	  	};
	})

	// allow entry to the block chain page
	.controller('homeCtrl', function($rootScope, $scope, $location, $interval) {

		// cancel price check
		$interval.cancel($rootScope.priceCheckPromise);

		$scope.pass = 0;
	    $scope.process = function() {

	    	$scope.pass++;

	    	if($scope.pass === 5) {

	    		$scope.pass = 0;
	    		$location.path('block');
	    	}
	    }
	})	

	// acts as a traffic router, depending on the price of rai
	.controller('faucetCtrl', function($rootScope, $scope, $location, $http) {

		// get price (replace with websockets in future)
		$http.get('/price').then(function(response) {

			// store price globally
			$rootScope.price = response.data.price;

			// not free
			if($rootScope.price > 0) {
				$location.path('purchase');
			} 
			// free!
			else {
				$location.path('free');
			}
		});
	})

	// get-started controller
	.controller('startCtrl', function($rootScope, $interval) {
		// cancel price check
		$interval.cancel($rootScope.priceCheckPromise);
	})
	
	// purchase USD ctrl (separeate BTC from here)
	.controller('purchaseCtrl', function(Button, API, Countdown, $rootScope, $scope, $http, $timeout, $interval, vcRecaptchaService) {
		
		var that = this;

		// initialize some $scope
		
		$rootScope.pricingError = undefined;

		$scope.paymentType = 'USD';
		$scope.userTyping = false;
		$scope.declineReason = undefined;
		$scope.account_id2 = null;
		$scope.response2 = null;
		$scope.widgetId2 = null;

		// watch countdown timer
		$rootScope.$watch('countdown', function() {
			if($rootScope.countdown !== undefined) {
				if($rootScope.countdown === 0) {
					if($rootScope.countdownType === 'purchasePage') {
					API.checkPrice();
					}
					else if($rootScope.countdownType === 'confirmBtc') {
						vcRecaptchaService.reload($scope.widgetId2);
						$rootScope.receiver = undefined;
						$rootScope.account_id2 = null;
						$rootScope.email_address_bitcoin = null;
						$rootScope.enteredAmount = null;
					}
				}
			}
		});

		// keystroke-check on amount
		$rootScope.$watch('enteredAmount', function() {

			if($rootScope.enteredAmount !== undefined && $rootScope.enteredAmount != '' && $rootScope.enteredAmount !== null) {
				
				// no error by default, and user is typing
				$rootScope.pricingError = undefined;
				$scope.userTyping = true;

				if($scope.priorKeyStroke === undefined) {
					var time = new Date().getTime();
					$scope.lastKeyStroke = time;
					$scope.priorKeyStroke = time-1;
				}
				else {
					$scope.priorKeyStroke = $scope.lastKeyStroke;
					$scope.lastKeyStroke = new Date().getTime();
				}

				//console.log('$scope.priorKeyStroke = ' + $scope.priorKeyStroke);
				//console.log('$scope.lastKeyStroke = ' + $scope.lastKeyStroke);

				// cancel the interval if it exists so we don't run it more than once.
				$interval.cancel($scope.keyStrokeCheck);
				// every .1s, check if the user stopped typing
				$scope.keyStrokeCheck = $interval(function() {
					// find out how many seconds have gone by since the last keystroke
					var secondsDiff = (new Date().getTime() - $scope.priorKeyStroke) / 1000;
					//console.log('Last keystroke was ' + secondsDiff + 'seconds ago');
					// if nothing has been typed this second (may change to a time difference like .5s)
					if(secondsDiff >= .75) {
						$scope.userTyping = false;
						$interval.cancel($scope.keyStrokeCheck);
						$scope.priorKeyStroke = undefined;
						if($rootScope.enteredAmount != '') {
							API.checkPrice();
						}
						else {
							Countdown.seconds(0, 'purchasePage');
						}
					}
				}, 100);

			}
			else {
				Countdown.seconds(0, 'purchasePage');
				$rootScope.price = 0;
			}
		});
		
		// empty purchase form
		$scope.newForm = function() {

			$rootScope.price = 0;
			$rootScope.enteredAmount = null;
			$scope.number = null;
			$scope.expiry = null;
			$scope.name = null;
			$scope.cvc = null;
			$scope.email_address_card = null;
			$scope.account_id2 = null;
			$scope.email_address_bitcoin = null;

			// credit card form
			$scope.form = [];
			$scope.form.number = $scope.number;
			$scope.form.expiry = $scope.expiry;
			$scope.form.name = $scope.name;
			$scope.form.cvc = $scope.cvc;
			$scope.form.email_address_card = $scope.email_address_card;
		}

  		$scope.setResponse2 = function (response) {
			$scope.response2 = response;
		};

		$scope.setWidgetId2 = function (widgetId) {
     		$scope.widgetId2 = widgetId;
  		};

  		// initialize buttons
		Button.create('purchase');
		Button.create('purchaseBtc');
		Button.create('confirmBtc');

		// define all button-states
		Button.mode('purchase', 'default', { 
			'disabled' : false, 
			'icon' : 'fa-cart-plus', 
			'title': 'Purchase', 
			'class': 'btn-primary'
		});

		Button.mode('purchaseBtc', 'default', { 
			'disabled' : false, 
			'icon' : 'fa-arrow-circle-o-right', 
			'title': 'Continue', 
			'class': 'btn-default'
		});

		Button.mode('confirmBtc', 'default', { 
			'disabled' : false, 
			'icon' : 'fa-checkmark', 
			'title': 'Confirm payment sent', 
			'class': 'btn-default'
		});

		Button.mode('purchaseBtc', 'create_receiver', { 
			'disabled' : true, 
			'icon' : 'fa-spin fa-spinner', 
			'title': 'Generating Bitcoin Receiver', 
			'class': 'btn-default'
		});

		Button.mode('purchase', 'purchasing', { 
			'disabled' : true, 
			'icon' : 'fa-spin fa-spinner', 
			'title': 'Purchasing', 
			'class': 'btn-default'
		});

		Button.mode('purchase', 'sent', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-up', 
			'title': 'RaiBlocks sent', 
			'class': 'btn-success'
		});

		Button.mode('purchase', 'no_amount', { 
			'disabled' : true, 
			'icon' : 'fa-exclamation-triangle', 
			'title': 'No Amount', 
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'no_price', { 
			'disabled' : true, 
			'icon' : 'fa-exclamation-triangle', 
			'title': 'RaiBlocks are free', 
			'class': 'btn-danger'
		});

		Button.mode('purchaseBtc', 'no_price', { 
			'disabled' : true, 
			'icon' : 'fa-exclamation-triangle', 
			'title': 'RaiBlocks are free', 
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'amount_error', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'How many are you purchasing?',
			'class': 'btn-danger'
		});

		Button.mode('purchaseBtc', 'amount_error', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'How many are you purchasing?',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'price_error', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Sorry, the price is free.',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'price_flux', {
			'disabled' : true, 
			'icon' : 'fa-frown-o', 
			'title': 'The price fluctuated too much.',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'account_error', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a valid account id',
			'class': 'btn-danger'
		});

		Button.mode('purchaseBtc', 'account_error', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a valid account id',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'email_missing', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a receipt email',
			'class': 'btn-danger'
		});

		Button.mode('purchaseBtc', 'email_missing', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a receipt email',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'card_error', {
			'disabled' : true, 
			'icon' : 'fa-credit-card', 
			'title': 'Provide a credit card number',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'expiry_error', {
			'disabled' : true, 
			'icon' : 'fa-credit-card', 
			'title': 'Provide an expiration date',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'name_error', {
			'disabled' : true, 
			'icon' : 'fa-credit-card',
			'title': 'Provide name on credit card',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'cvc_error', {
			'disabled' : true, 
			'icon' : 'fa-credit-card',
			'title': 'Provide the CVC code',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'recaptcha_error', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Complete the reCaptcha',
			'class': 'btn-danger'
		});

		Button.mode('purchaseBtc', 'recaptcha_error', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Complete the reCaptcha',
			'class': 'btn-danger'
		});

		Button.mode('purchaseBtc', 'receiver_created', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-up', 
			'title': 'Bitcoin Receiver Created',
			'class': 'btn-success'
		});

		Button.mode('confirmBtc', 'not_filled', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Payment not received',
			'class': 'btn-danger'
		});

		Button.mode('confirmBtc', 'sent', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-up', 
			'title': 'Raiblocks Sent',
			'class': 'btn-success'
		});

		Button.mode('confirmBtc', 'checking', { 
			'disabled' : true, 
			'icon' : 'fa-spin fa-spinner', 
			'title': 'Checking Payment Status',
			'class': 'btn-default'
		});

		Button.mode('confirmBtc', 'payment_made', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Payment was already made for this receiver',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'invalid_number', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a valid card number',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'card_declined', {
			'disabled' : true, 
			'icon' : 'fa-exclamation-triangle', 
			'title': 'Your card has been declined',
			'class': 'btn-danger'
		});

		Button.mode('purchase', 'invalid_expiry_year', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a valid expiration year',
			'class': 'btn-danger'
		});

		// set buttons to default to start
		Button.change('purchase', 'default');
		Button.change('purchaseBtc', 'default');
		Button.change('confirmBtc', 'default');

		// confirm BTC payment button
		$scope.btcConfirm = function() {

			Button.change('confirmBtc', 'checking');

			API.call('confirmBtc', {}).then(function(response) {

				Button.change('confirmBtc', response.data.message);

				$timeout(function() {

					if(response.data.message === 'sent') {
						// clear the recaptcha
						vcRecaptchaService.reload($scope.widgetId2);
						// new form
						$scope.newForm();
						// empty the reciever
						$rootScope.receiver = undefined;
						Button.change('confirmBtc', 'default');
					} else {
						Button.change('confirmBtc', 'default');
					}
					
				}, 3000);

			});
		}

		// create receiver (Continue) button
		$scope.btcContinue = function() {

			// amount error
			if($rootScope.enteredAmount == null || $rootScope.enteredAmount == '') {

				Button.change('purchaseBtc', 'amount_error');

				$timeout(function() {
					Button.change('purchaseBtc', 'default');
				}, 3000);
			}

			// account error
			else if($scope.account_id2 == null || $scope.account_id2 == '') {

				Button.change('purchaseBtc', 'account_error');

				$timeout(function() {
					Button.change('purchaseBtc', 'default');
				}, 3000);
			}

			// recaptcha error
			else if($scope.response2 == null || $scope.response2 == '') {
				
				Button.change('purchaseBtc', 'recaptcha_error');

				$timeout(function() {
					Button.change('purchaseBtc', 'default');
				}, 3000);
			}

			// email missing
			else if($scope.email_address_bitcoin == null || $scope.email_address_bitcoin == '') {

				Button.change('purchaseBtc', 'email_missing');

				$timeout(function() {
					Button.change('purchaseBtc', 'default');
				}, 3000);
			}

			// all good
			else {

				Button.change('purchaseBtc', 'create_receiver');

				payload = {};
				payload.amount = $rootScope.enteredAmount;
				payload.account_id = $scope.account_id2;
				payload.receipt_email = $scope.email_address_bitcoin;
				payload.payment_type = $scope.paymentType;

				API.call('charge', payload).then(function(response) {
					
					// store btc receiver in rootscope
						$rootScope.receiver = response.data.receiver;
					
					// update button
					Button.change('purchaseBtc', response.data.message);

					// if we created a new btc receiver...
					if(response.data.message == 'receiver_created') {
						// start an 8-minute countdown
						Countdown.seconds(480, 'confirmBtc');
					}

					$timeout(function() {
						Button.change('purchaseBtc', 'default');
					}, 3000);

				});
			}
		}

		$scope.handleStripe = function(status, response) {

			// clear decline reason
			$scope.declineReason = undefined;

			// amount error
			if($rootScope.enteredAmount == null || $rootScope.enteredAmount == '') {

				Button.change('purchase', 'amount_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// account error
			else if($scope.account_id2 == null || $scope.account_id2 == '') {

				Button.change('purchase', 'account_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// recaptcha error
			else if($scope.response2 == null || $scope.response2 == '') {
				
				Button.change('purchase', 'recaptcha_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// card number error
			else if($scope.number == null || $scope.number == '') {

				Button.change('purchase', 'card_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// expiry error
			else if($scope.expiry == null || $scope.expiry == '') {

				Button.change('purchase', 'expiry_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// name error
			else if($scope.name == null || $scope.name == '') {

				Button.change('purchase', 'name_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// cvc error
			else if($scope.cvc == null || $scope.cvc == '') {

				Button.change('purchase', 'cvc_error');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// email missing
			else if($scope.email_address_card == null || $scope.email_address_card == '') {

				Button.change('purchase', 'email_missing');

				$timeout(function() {
					Button.change('purchase', 'default');
				}, 3000);
			}

			// successful form submission
			else {$

				$interval.cancel($rootScope.priceCheckPromise);

				Button.change('purchase', 'purchasing');

				// attempting purchase...
				$timeout(function() {

					payload = {};
					payload.token = response.id;
					payload.amount = $rootScope.enteredAmount;
					payload.account_id = $scope.account_id2;
					payload.receipt_email = $scope.email_address_card;
					payload.payment_type = $scope.paymentType;

					API.call('charge', payload).then(function(resp) {

						Button.change('purchase', resp.data.message);

						// card declined reason
						if(resp.data.message == 'card_declined') {
							$scope.declineReason = resp.data.reason;
						}
						$timeout(function() {

							// don't reset form if the card declined.
							if(resp.data.message == 'card_declined') {
								Button.change('purchase', 'default');
							}
							else {
								Countdown.seconds(0, 'purchasePage');
								vcRecaptchaService.reload($scope.widgetId2);
								$scope.newForm();
								Button.change('purchase', 'default');
								$scope.account_id2 = null;
							}

						}, 3000);

					});
					
				}, 3000);
			}
		}
	})
	
	// get free rai
	.controller('freeCtrl', function(Button, $scope, $http, $timeout, vcRecaptchaService) {

		var that = this;

		$scope.init = function () {
			$scope.account = null;
			$scope.response = null;
			$scope.widgetId = null;
		}

		$scope.init();
		
  		$scope.setResponse = function (response) {
			$scope.response = response;
		};

		$scope.setWidgetId = function (widgetId) {
     		$scope.widgetId = widgetId;
  		};

  		Button.create('free');

		Button.mode('free', 'default', { 
			'disabled' : false, 
			'icon' : 'fa-plus-circle', 
			'title': 'Request free 1 Grai', 
			'class': 'btn-primary'
		});

		Button.mode('free', 'claiming', { 
			'disabled' : true, 
			'icon' : 'fa-spin fa-spinner', 
			'title': 'Sending free Grai', 
			'class': 'btn-default'
		});

		Button.mode('free', 'claimed', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-up', 
			'title': 'Free Grai Sent', 
			'class': 'btn-success'
		});

		Button.mode('free', 'account_error', {
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Provide a valid account id', 
			'class': 'btn-danger'
		});

		Button.mode('free', 'recaptcha_error', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Complete the reCaptcha', 
			'class': 'btn-danger'
		});

		Button.mode('free', 'recaptcha_error', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Complete the reCaptcha', 
			'class': 'btn-danger'
		});

		Button.mode('free', 'not_free', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'RaiBlocks are not free right now', 
			'class': 'btn-danger'
		});

		Button.change('free', 'default');

		$scope.submit = function () {

			if($scope.account == null || $scope.account == '') {

				Button.change('free', 'account_error');

				$timeout(function() {
					Button.change('free', 'default');
				}, 3000);

			} else if($scope.response == null || $scope.response == '') {

				Button.change('free', 'recaptcha_error');

				$timeout(function() {
					Button.change('free', 'default');
				}, 3000);

			} else {

				Button.change('free', 'claiming');

				payload = {};
				payload.account = $scope.account;
				payload.response = $scope.response;

				$http.post('/freecoins', payload)

				.success(function(data) {

					$timeout(function() {

						Button.change('free', data.message);

						$timeout(function() {
							vcRecaptchaService.reload($scope.widgetId);
							$scope.init();
							Button.change('free', 'default');
						}, 3000);

					}, 3000);
				})
				.error(function(data, status) {
					console.error('Error', status, data);
				})
				.finally(function() {
					
				});
			}
		}		
	})

	// block chain page
	.controller('blockCtrl', function(Button, $http, $rootScope, $scope, $timeout) {

		Button.create('block');

		Button.mode('block', 'default', { 
			'disabled' : false, 
			'icon' : 'fa-plus-circle', 
			'title': 'Process Block Chain', 
			'class': 'btn-primary'
		});

		Button.mode('block', 'processing', { 
			'disabled' : true, 
			'icon' : 'fa-spin fa-spinner', 
			'title': 'Processing Block Chain', 
			'class': 'btn-default'
		});

		Button.mode('block', 'processed', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-up', 
			'title': 'Block Chain Processed', 
			'class': 'btn-success'
		});

		Button.mode('block', 'empty_block', { 
			'disabled' : true, 
			'icon' : 'fa-thumbs-down', 
			'title': 'Block Chain Empty', 
			'class': 'btn-danger'
		});

		Button.change('block', 'default');

		$scope.submit = function() {
			if($scope.blockChain === undefined || $scope.blockChain === null || $scope.blockChain === '') {
				Button.change('block', 'empty_block');
				$timeout(function() {
					Button.change('block', 'default');
				}, 3000);
			}
			else {

				Button.change('block', 'processing');
				var blockStr = JSON.stringify($scope.blockChain);
				blockStr = blockStr.substring(1, blockStr.length - 1);
				$http.post('/api/processBlockChain', { block: blockStr })
				.success(function(data, status, headers, config) {
					Button.change('block', 'processed');
					$timeout(function() {
						Button.change('block', 'default');
					}, 3000);
				});
			}
		}
	})
		
	// countdown timers
	.service('Countdown', function($q, $interval, $rootScope) {

		// countdown a specific amount of seconds
		this.seconds = function(startingSeconds, type) {

			$rootScope.countdownType = type;

			// cancel the existing countdown for this scopeName
			$interval.cancel($rootScope.countdownPromise);
			
			// continue timer unless 0 is passed.
			if(startingSeconds > 0) {

				// update scope with seconds passed initially
				$rootScope.countdown = startingSeconds;

				// store our 1-second interval as a promise to cancel later
				$rootScope.countdownPromise = $interval(function() {

					// are we at zero?
					if($rootScope.countdown === 0) {
						$interval.cancel($rootScope.countdownPromise);
					}

					// subtract 1s from the countdown
					$rootScope.countdown--;
				}, 1000);
			}
		}
	})

	// dynamic buttons
	.service('Button', function($q, $rootScope, vcRecaptchaService) {

		// create button object
		this.create = function(name) {
			$rootScope[name] = {};
		}

		// define all modes in rootScope
		this.mode = function(name, mode, properties) {

			$rootScope[name][mode] = {};

			return $q(function(resolve, reject) {
				angular.forEach(properties, function(val, key) {
					$rootScope[name][mode][key] = val;
				});
 				resolve();
  			});
		}

		// change the button status
		this.change = function(name, mode) {

			return $q(function(resolve, reject) {
				$rootScope[name].active = $rootScope[name][mode];
 				resolve();
  			});
		}
	})

	// application API connector to RPC
	.service('API', function($q, $http, $rootScope, Countdown) {

		var that = this;

		this.call = function(path, payload) {

			var defer = $q.defer()

			$http.post('/api/'+path, payload)
			.then(function(response) {
				defer.resolve(response)
			})
 
			return defer.promise
		}

		this.checkPrice = function() {

			// no null amount
			if($rootScope.enteredAmount != null) {

				$rootScope.checkingPrice = true;

				//console.log('Checking price for ' + $rootScope.enteredAmount);
				that.call('checkPrice', { 'amount': $rootScope.enteredAmount }).then(function(response) {

					if(response.data.httpcode === 200) {
						Countdown.seconds(300, 'purchasePage');
						$rootScope.price = response.data.price;
						$rootScope.pricingError = undefined;
					}
					else if(response.data.httpcode === 400) {
						$rootScope.price = 0;
						$rootScope.pricingError = response.data.price;
					}

					$rootScope.checkingPrice = false;
				});
			}
		}
	})

})();