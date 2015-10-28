/**
 * Pricing Service
 */

module.exports = {

	verifyPrice: function(amount, callback) {

		PricingService.checkPrice(amount, function(err, response) {

			if(!err) {

			} else {

			}

		});
	},

	checkPrice: function(amount, callback) {

		//payload = { 'action': 'price', 'amount': amount, 'account': Globals.faucetAddress };
		//payload = JSON.stringify({ 'action': 'price', 'amount': amount, 'account': Globals.faucetAddress });
		payload = '{ "action": "price", "amount": "' + amount + '", "account": "' + Globals.faucetAddress + '"}';

		RpcService.callRpc(payload, function(err, response) {

			if(!err) {

			} else {

			}

		});

		// return price and amount
		//callback(null, { 'success': true });
	}

}