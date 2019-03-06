
'use strict';

var request = require('request');
var winston = require('winston');

var fs = require('fs');
var async = require.main.require('async');

(function(pixeldrain) {

	pixeldrain.init = function(params, callback) {
		callback();
	};

	pixeldrain.upload = function (data, callback) {
		var settings;
		var image = data.image;

		if (!image) {
			return callback(new Error('invalid image'));
		}

		async.waterfall([
			function (next) {
				doUpload(data, settings, next);
			}
		], callback);
	};

	function doUpload(data, settings, callback) {
		function done(err) {
			if (!callbackCalled) {
				callbackCalled = true;
				callback(err);
			}
		}

		var image = data.image;

		var callbackCalled = false;
		var type = image.url ? 'url' : 'file';
		if (type === 'file' && !image.path) {
			return callback(new Error('invalid image path'));
		}

		var formDataImage;
		if (type === 'file') {
			formDataImage = fs.createReadStream(image.path);
			formDataImage.on('error', function(err) {
				done(err);
			});
		} else if (type === 'url') {
			formDataImage = image.url;
		} else {
			return callback(new Error('unknown-type'));
		}

		var options = {
			url: 'https://pixeldrain.com/api/file',
			formData: {
				file: formDataImage
			}
		};

		request.post(options, function (err, req, body) {
			if (err) {
				return done(err);
			}

			var response;
			try {
				response = JSON.parse(body);
			} catch(err) {
				winston.error('Unable to parse pixeldrain json response. [' + body +']', err.message);
				return done(err);
			}

			if (response.success) {
				return callback(null, {
					name: image.name,
					url: "https://pixeldrain.com/api/file/" + response.id
				});
			}

			done(new Error(response.data.error.message || response.data.error));
		});
	}

}(module.exports));

