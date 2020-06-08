
const { promisify } = require('util');
const got = require('got');
const pjson = require('../../package');

const instance = got.extend({
	prefixUrl: 'https://picobrew.com',
	headers: {
		'user-agent': `${pjson.name}/${pjson.version}`
	},
	responseType: 'json',
	handlers: [
		(options: any, next: any) => {
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

					console.log(error.response.body)

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