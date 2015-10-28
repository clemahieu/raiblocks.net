/**
 * RaiBlock's RPC Service
 */

module.exports = {

	callRpc: function(postData, callback) {

		var 
		http = require('http'),
		querystring = require('querystring');
		//postData = querystring.stringify(postData);

		// request options
		var options = {
			host : Globals.rpcHost,
			port : Globals.rpcPort,
			method : 'POST',
			headers : { 
				'content-type': 'application/json', 
				'Accept': '*/*' 
			}
		};

		console.log(options);

		// define request
		var req = http.request(options, function(res) {

		    // response data
		    res.on('data', function(d) {
		    	
		    	var response = d.toString();
		    	console.log(response);
		    	callback(null, response);

		    });
		});

		console.log(postData);

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