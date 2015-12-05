module.exports = {

	/*
	Begins a transaction, either moving an account from the inactiveWallet to activeWallet
	or generates a new random account number
	Returns an account number in the activeWallet
	 */
  begin: function(parameters, callback) {

		payload = {};
		payload.action = 'payment_begin';
		payload.inactive_wallet = Globals.inactiveWallet;
		payload.active_wallet = Globals.activeWallet;

    // Returns { 'account': 'U63Kt3B7yp2iQB4GsVWriGv34kk2qwhT7acKvn8yWZGdNVesJ8' }
		RpcService.callRpc(payload, function(err, response) {

			if(!err) {
				callback(null, response);
			} else {
				callback(err, null);
			}

		});
  }

	/*
	Checks whether inactiveWallet and activeWallet are valid wallet ids and are unlocked
	Returns status == 'Ready' if they're ready or an error message describing the issue
	 */
  check: function(parameters, callback) {

    payload = {};
    payload.action = 'payment_check';
    payload.inactive_wallet = Globals.inactiveWallet;
    payload.active_wallet = Globals.activeWallet;

    // Returns { 'status': 'Ready' }
		RpcService.callRpc(payload, function(err, response) {

			if(!err) {
			  if(response.status == 'Ready') {
				  callback(null, response);
				}
				else {
				  callback({ message: response.status }, null);
				}
			} else {
				callback(err, null);
			}

		});
  }

	/*
	Marks 'account' as inactive, letting it be reused later by a different payment_begin
	 */
  end: function(parameters, callback) {

		payload = {};
		payload.action = 'payment_end';
		payload.inactive_wallet = Globals.inactiveWallet;
		payload.active_wallet = Globals.activeWallet;
		payload.account = parameters.account;

    // Returns {}
		RpcService.callRpc(payload, function(err, response) {

			if(!err) {
				callback(null, response);
			} else {
				callback(err, null);
			}

		});
  }

	/*
	Wait 'timeout' milliseconds for 'amount' Rai to land in 'account'
	Returns when the amount has been received, with status == 'success' or
	Returns when timeout has been reached
	 */
  wait: function(parameters, callback) {

		payload = {};
		payload.action = 'payment_wait';
		payload.account = parameters.account;
		payload.amount = parameters.amount;
		payload.timeout = parameters.timeout;

    // Returns { 'status': 'success' }
		RpcService.callRpc(payload, function(err, response) {

			if(!err) {
			  if(response.status == 'success') {
				  callback(null, response);
				}
				else {
				  callback({ message: 'Amount not received' }, null);
				}
			} else {
				callback(err, null);
			}

		});
  }

}
