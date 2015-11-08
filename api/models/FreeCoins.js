/**
* FreeCoins.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {

		account: {
			type:'string',
			required:true,
			unique: true
		},

		response: {
			type:'string',
			required:true,
			unique: true
		}
	},

	/**
	 * Verifies ...
	 * passed parameters,
	 * recaptcha response,
	 * price of Rai
	 */
	
	processRequest: function(parameters, callback) {

		// ensure all parameters are fulfilled
		FreeCoinsService.verifyParameters(parameters, function(err, response) {
			console.log('FreeCoinsService');

			// parameters passed!
			if(!err) {

				console.log(response);

				// ensure the recaptcha response is valid by asking Google
				RecaptchaService.verifyResponse(parameters.response, function(err, response) {
					console.log('RecaptchaService');

					if(!err) {

						// recaptcha passed!
						if(response.success) {

							console.log(response);

							// check the price for a single unit to determine if it's free or not
							PricingService.checkPrice(1, function(err, response) {
								console.log('PricingService');

								// price verification passed!
								if(!err) {

									console.log(response);

									// check if the account is valid
									ValidateAccountService.validate(parameters.account, function(err, response) {
										console.log('ValidateAccountService');

										if(!err) {

											console.log(response);

											// send coins to account
											FreeCoinsService.send(parameters, function(err, response) {
												console.log('FreeCoinsService');

												if(!err) {

													console.log(response);
													callback(null, response);

												} else {

													console.log(err);
													callback(null, err); // free coins were not sent
												}
											});

										} else {
											console.log(err);
											callback(err, null); // account validation failed!
										}
									});

								} else {
									console.log(err);
									callback(err, null); // price check failed!
								}
							});
						} else {
							console.log(response);
							callback(response, null); // recaptcha failed!
						}

					} else {
						console.log(err);
						callback(err, null); // recaptcha failed!
					}
				});

			} else {
				console.log(err);
				callback(err, null); // one or more params failed!
			}
		});
	}

};