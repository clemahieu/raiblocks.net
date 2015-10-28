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
				return res.send(response);
			} else {
				return res.send(err);
			}
		});

	}
};