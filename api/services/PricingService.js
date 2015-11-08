/**
 * Pricing Service
 *
 */

module.exports = {

	// accept an amount, and get the price for it from the rpc.
	checkPrice: function(amount, callback) {

		payload = {};
		payload.action = 'price';
		payload.amount = amount;
		payload.account = Globals.faucetAddress;
	
		// should return { 'price': 123 }
		RpcService.callRpc(payload, function(err, response) {

			if(!err) {
				callback(null, response);
			} else {
				callback(err, null);
			}
		});
	}

}