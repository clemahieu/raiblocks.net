/**
 * PriceController
 *
 * @description :: Server-side logic for managing prices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
	// override the POST/create route/action for this API call
	find: function (req, res) {

		//console.log('controller hit');

		PricingService.checkPrice(1, function(err, response) {

			if(err) {
				//console.log('controller error');
				//console.log(err);
			} else {
				//console.log('controller response');
				//console.log(response);
				res.send(response);
			}

		});
	}
};

