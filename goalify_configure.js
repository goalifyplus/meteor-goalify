Template.configureLoginServiceDialogForGoalify.helpers({
	siteUrl: function() {
		return Meteor.absoluteUrl();
	},
});

Template.configureLoginServiceDialogForGoalify.fields = function() {
	return [{ property: 'clientId', label: 'Client Id' }, { property: 'secret', label: 'Client Secret' }];
};
