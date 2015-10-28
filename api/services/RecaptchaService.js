/**
 * Make a remote call to the Google Recaptcha Verification server
 * @type {[type]}
 */
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
 			callback(null, { 'response': 'Parameters passed', 'success': true });
 		} 
 		// there were problems. doh!
 		else {
 			callback({ 'response': 'Parameters failed', 'success': false }, null);
 		}
 	},

 	// make sure the recaptcha response is valid with Google
 	verifyResponse: function(response, callback) {

 		var 
 		https = require('https'),
 		secret = Globals.recaptchaSecret,
 		options = {
 			host : 'www.google.com',
 			port : 443,
 			path : '/recaptcha/api/siteverify?secret=' + secret + '&response=' + response,
 			method : 'GET'
 		},
 		req = https.request(options, function(res) {

		    // response data
		    res.on('data', function(d) {

		    	var 
		    	response = JSON.parse(d.toString()),
		    	success = response.success;

		    	//TESTING
		    	response['error-codes'][0] = 'success';
		    	success = true;
		    	//END TESTING


		    	// there can be multiple error codes, apparently, but we'll assume there's one.
		    	if(response['error-codes'][0] == 'invalid-input-response') {

		    		// trigger error callback
		    		callback({ 'response': 'The ReCaptcha response you provided is invalid.', 'success': success }, null);
		    	} 

		    	// handle other responses, like SUCCESS?
		    	else {

		    		// trigger error callback
		    		callback(null, { 'response': 'Success!', 'success': success });
		    	}	
		    });
		});

		//perform curl and end
		req.end();

		// watch for errors
		req.on('error', function(err) {
			callback(err, null);
		});
	}
}