'use strict';

/**
 * Define the base object namespace. By convention we use the service name
 * in PascalCase (aka UpperCamelCase). Note that this is defined as a package global (boilerplate).
 */
Goalify = Goalify || {};

/**
 * Request Goalify credentials for the user (boilerplate).
 * Called from accounts-goalify.
 *
 * @param {Object}    options                             Optional
 * @param {Function}  credentialRequestCompleteCallback   Callback function to call on completion. Takes one argument, credentialToken on success, or Error on error.
 */
Goalify.requestCredential = function(options, credentialRequestCompleteCallback) {
	/**
	 * Support both (options, callback) and (callback).
	 */
	if (!credentialRequestCompleteCallback && typeof options === 'function') {
		credentialRequestCompleteCallback = options;
		options = {};
	} else if (!options) {
		options = {};
	}

	/**
	 * Make sure we have a config object for subsequent use (boilerplate)
	 */
	const config = ServiceConfiguration.configurations.findOne({
		service: 'goalify',
	});
	if (!config) {
		credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
		return;
	}

	/**
	 * Boilerplate
	 */
	const credentialToken = Random.secret();
	const loginStyle = OAuth._loginStyle('goalify', config, options);
	const state = OAuth._stateParam(loginStyle, credentialToken);
	const apiHost = config.apiHost || 'https://api.goalify.plus';

	/**
	 * Goalify requires response_type and client_id
	 * We use state to roundtrip a random token to help protect against CSRF (boilerplate)
	 */
	const loginUrl =
		apiHost +
		'/oauth/request/authorize' +
		'?response_type=code' +
		'&client_id=' +
		config.clientId +
		'&scope=profile' +
		'&redirect_uri=' +
		config.redirectUri +
		'&state=' +
		state;

	/**
	 * Client initiates OAuth login request (boilerplate)
	 */
	OAuth.launchLogin({
		loginService: 'goalify',
		loginStyle: loginStyle,
		loginUrl: loginUrl,
		credentialRequestCompleteCallback: credentialRequestCompleteCallback,
		credentialToken: credentialToken,
		popupOptions: {
			height: 600,
		},
	});
};
