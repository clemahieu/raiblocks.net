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

		RecaptchaService.verifyParameters(parameters, function(err, response) {

			// all params passed!
			if(!err) {

				// make sure the recaptcha response is valid (talk to Google quick)
				RecaptchaService.verifyResponse(parameters.response, function(err, response) {

					// recaptcha passed!
					if(!err) {

						PricingService.verifyPrice(1, function(err, response) {

							// price verification passed!
							if(!err) {
								callback(null, response);
							} else {
								callback(err, null); // price check failed!
							}

						});

					} else {
						callback(err, null); // recaptcha failed!
					}

				});

			} else {
				callback(err, null); // one or more params failed!
			}
		});

	}
};

