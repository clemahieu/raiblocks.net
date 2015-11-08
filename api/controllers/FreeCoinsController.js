/**
 * FreeCoinsController
 *
 * @description :: Server-side logic for managing freecoins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	// override the POST/create route/action for this API call
	create: function (req, res) {

		// 2 required parameters (account, response)
		parameters = [];
		parameters.account = req.body.account;
		parameters.response = req.body.response;

		FreeCoins.processRequest(parameters, function(err, response) {

			// request processed!
			if(!err) {
				//console.log('free coins response');
				//console.log(response);
				response.message = 'claimed';
				res.send(response);
			} else {
				//console.log('free coins error');
				//console.log(err);
				res.send(err);
			}
		});

	}
};