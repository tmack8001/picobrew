
const { promisify } = require('util');
const got = require('got');
// const package = require('../../package');

const instance = got.extend({
	prefixUrl: 'https://picobrew.com',
	headers: {
		'user-agent': `picobrew-cli/0.1.0` // `${package.name}/${package.version}`
	},
	responseType: 'json',
	handlers: [
		(options, next) => {
			// Don't touch streams
			if (options.isStream) {
				return next(options);
			}

			// Magic begins
			return (async () => {
				try {
					const response = await next(options);

					return response;
				} catch (error) {
					const {response} = error;

					// Nicer errors
					if (response && response.body) {
						error.name = 'PicobrewError';
						error.message = `${response.body.message} (${response.statusCode} status code)`;
					}

					throw error;
				}
			})();
		}
	]
});

module.exports = instance;