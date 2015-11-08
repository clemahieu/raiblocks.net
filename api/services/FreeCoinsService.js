module.exports = {

 	// make sure our parameters aren't undefined or zero-length
 	verifyParameters: function(parameters, callback) {

 		// no problems by default
 		var problems = 0;

 		// iterate through all parameters and
 		parameters.forEach(function(parameter) {
 			// make sure they aren't undefined or empty
 			if(parameter === undefined || parameter.length === 0) {
 				// increase our problem count
 				problems++;
 			}
 		});

 		// no problems. great!
 		if(problems === 0) {
 			callback(null, { success: true });
 		} 
 		// there were problems. doh!
 		else {
 			callback({ success: false }, null);
 		}
 	},

 	send: function(parameters, callback) {
		
		parameters.amount = 1000;

		SendCoinsService.send(parameters, function(err, response) {

			if(!err) {
				callback(null, response);
			} else {
				callback(err, null);
			}
		});
 	}

}