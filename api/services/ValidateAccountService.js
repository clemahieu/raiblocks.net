module.exports = {

	validate: function(account, callback) {

		payload = {};
		payload.action = 'validate_account_number';
		payload.account = account;
		
		returned = {};

		RpcService.callRpc(payload, function(err, response) {

			if(!err) {

				// valid account
				if(response.valid == '1') {
					callback(null, response);
				} 
				// invalid account
				else {
					callback( { message: 'account_error' }, null);
				}

			} else {
				callback(err, null);
			}
		});
	}
	
}