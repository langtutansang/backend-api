'use strict';

module.exports = function(Typedocuments) {
	Typedocuments.validatesLengthOf('name', {min: 3, max: 200, message: {min: 'Name is too short', max: 'Name is too long'}});

	const enabledRemoteMethods = [
    'find', 'login', 'create',
    'deleteById', 'findById', 'replaceById', 'findOne'
	];
	
  Typedocuments.sharedClass.methods().forEach(function(method) {
    const methodName = method.stringName.replace(/.*?(?=\.)/, '').substr(1);
    if (enabledRemoteMethods.indexOf(methodName) === -1) {
      Typedocuments.disableRemoteMethodByName(methodName);
    }
  });

	// Typedocuments.afterRemote('*', function(req, res, next) {
  //   req.result = {error: null, data: res};
  //   next();
	// });
	
  // Typedocuments.afterRemoteError('*', function(context, next) {

  //   return context.res.json({error: {
  //     code: context.error.name,
  //     message: context.error.message,
  //     num: context.error.statusCode,
  //   }, data: null});
  // });
};
