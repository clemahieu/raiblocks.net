/**
 * RaiBlock's RPC Service
 *
 * Performs an HTTP request to the RB RPC
 */

module.exports = {

	callRpc: function(postData, callback) {

		var 
		http = require('http'),
		postData = JSON.stringify(postData);

		// request options
		var options = {
			hostname : Globals.rpcHost,
			port : Globals.rpcPort,
			method : 'POST',
			headers : { 
				'Content-Type': 'application/json',
				'Content-Length': postData.length,
				'Accept': '*/*' 
			}
		};

		// define request
		var req = http.request(options, function(res) {

		    // response data
		    res.on('data', function(response) {
		    	response = JSON.parse(response.toString());
		    	callback(null, response);
		    });
		});

		// send post daaderta in request
		req.write(postData);

		// end request
		req.end();

		// watch for errors
		req.on('error', function(err) {
			callback(err, null);
		});

	}

}