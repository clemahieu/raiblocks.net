module.exports = {

	/*
	Send a specified amount of coins to a specified account
	parameters (account_id, amount)
	 */
	send: function(parameters, callback) {

		payload = {};
		payload.action = 'send';
		payload.wallet = Globals.walletNumber;
		payload.source = Globals.faucetAddress;
		payload.destination = parameters.account;
		payload.amount = parameters.amount.toString().concat(Globals.mrai);

		RpcService.callRpc(payload, function(err, response) {

			if(!err) {
				callback(null, response);
			} else {
				callback(err, null);
			}

		});
	}
	
}