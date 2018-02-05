'use strict';

/**
 * Define the base object namespace. By convention we use the service name
 * in PascalCase (aka UpperCamelCase). Note that this is defined as a package global.
 */
Goalify = Goalify || {};

/**
 * Boilerplate hook for use by underlying Meteor code
 */
Goalify.retrieveCredential = (credentialToken, credentialSecret) => {
	return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

Goalify.whitelistedFields = ['id', 'email', 'username', 'fullname', 'firstName', 'lastName', 'avatar', 'gender'];

/**
 * Register this service with the underlying OAuth handler
 * (name, oauthVersion, urls, handleOauthRequest):
 *  name = 'goalify'
 *  oauthVersion = 2
 *  urls = null for OAuth 2
 *  handleOauthRequest = function(query) returns {serviceData, options} where options is optional
 * serviceData will end up in the user's services.goalify
 */
OAuth.registerService('goalify', 2, null, function(query) {
	/**
	 * Make sure we have a config object for subsequent use (boilerplate)
	 */
	const config = ServiceConfiguration.configurations.findOne({
		service: 'goalify',
	});
	if (!config) {
		throw new ServiceConfiguration.ConfigError();
	}

	/**
	 * Get the token and username (Meteor handles the underlying authorization flow).
	 * Note that the username comes from from this request in Goalify.
	 */
	const response = getTokens(config, query);
	const accessToken = response.accessToken;

	/**
	 * If we got here, we can now request data from the account endpoints
	 * to complete our serviceData request.
	 * The identity object will contain the username plus *all* properties
	 * retrieved from the account and settings methods.
	 */
	const identity = getAccount(config, accessToken);
	identity.id = identity.username;

	/**
	 * Build our serviceData object. This needs to contain
	 *  accessToken
	 *  expiresAt, as a ms epochtime
	 *  refreshToken, if there is one
	 *  id - note that there *must* be an id property for Meteor to work with
	 *  email
	 * We'll put the username into the user's profile
	 */
	const serviceData = {
		accessToken,
		expiresAt: +new Date() + 1000 * response.expiresIn,
	};
	if (response.refreshToken) {
		serviceData.refreshToken = response.refreshToken;
	}
	_.extend(serviceData, _.pick(identity, Goalify.whitelistedFields));

	/**
	 * Return the serviceData object along with an options object containing
	 * the initial profile object with the username.
	 */
	return {
		serviceData: serviceData,
		options: {
			profile: {
				name: identity.username, // comes from the token request
			},
		},
	};
});

/**
 * The following three utility functions are called in the above code to get
 *  the access_token, refresh_token and username (getTokens)
 *  account data (getAccount)
 *  settings data (getSettings)
 * repectively.
 */

/** getTokens exchanges a code for a token in line with Goalify's documentation
 *
 *  returns an object containing:
 *   accessToken        {String}
 *   expiresIn          {Integer}   Lifetime of token in seconds
 *   refreshToken       {String}    If this is the first authorization request
 *   account_username   {String}    User name of the current user
 *   token_type         {String}    Set to 'Bearer'
 *
 * @param   {Object} config       The OAuth configuration object
 * @param   {Object} query        The OAuth query object
 * @return  {Object}              The response from the token request (see above)
 */
const getTokens = function(config, query) {
	const endpoint = 'https://api.dev.goalify.plus/oauth/token';

	/**
	 * Attempt the exchange of code for token
	 */
	let response;
	try {
		response = HTTP.post(endpoint, {
			params: {
				code: query.code,
				client_id: config.clientId,
				client_secret: OAuth.openSecret(config.secret),
				grant_type: 'authorization_code',
				redirect_uri: Goalify.redirectUri || 'http://localhost:3000/_oauth/goalify',
			},
		});
	} catch (err) {
		throw _.extend(new Error(`Failed to complete OAuth handshake with Goalify. ${err.message}`), {
			response: err.response,
		});
	}

	if (response.data.error) {
		/**
		 * The http response was a json object with an error attribute
		 */
		throw new Error(`Failed to complete OAuth handshake with Goalify. ${response.data.error}`);
	} else {
		/** The exchange worked. We have an object containing
		 *   access_token
		 *
		 * Return an appropriately constructed object
		 */
		return {
			accessToken: response.data.access_token,
			expiresIn: 600,
		};
	}
};

/**
 * getAccount gets the basic Goalify account data
 *
 *  returns an object containing:
 *   fullname       {String}         The user's full name
 *   firstName      {String}         The user's first name
 *   lastName       {String}         The user's last name
 *   username       {String}         The account username
 *   avatar         {String}         The account avatar
 *   birthday       {String}         The user's birthday
 *   gender         {String}         The user's gender
 *   email          {String}         The user's email
 *
 * @param   {Object} config       The OAuth configuration object
 * @param   {String} accessToken  The OAuth access token
 * @return  {Object}              The response from the account request (see above)
 */
const getAccount = function(config, accessToken) {
	const endpoint = 'https://api.dev.goalify.plus/api/userinfo';
	let accountObject;

	/**
	 * Note the strange .data.data - the HTTP.get returns the object in the response's data
	 * property. Also, Goalify returns the data we want in a data property of the response data
	 * Hence (response).data.data
	 */
	try {
		accountObject = HTTP.get(endpoint, {
			headers: {
				Authorization: `JWT ${accessToken}`,
			},
		}).data;
		return accountObject;
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch account data from Goalify. ${err.message}`), {
			response: err.response,
		});
	}
};
