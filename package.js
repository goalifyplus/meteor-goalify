Package.describe({
	name: 'erictran:goalify',
	version: '0.0.2',
	summary: 'OAuth handler for Goalify',
	git: 'https://github.com/goalifyplus/meteor-goalify',
	documentation: 'README.md',
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use('ecmascript');
	api.use('accounts-ui', ['client', 'server']);
	api.use('oauth2', ['client', 'server']);
	api.use('oauth', ['client', 'server']);
	api.use('http', ['server']);
	api.use(['underscore', 'service-configuration'], ['client', 'server']);
	api.use(['random', 'templating'], 'client');

	api.export('Goalify');

	api.addFiles('goalify_server.js', 'server');
	api.addFiles('goalify_client.js', 'client');
});
