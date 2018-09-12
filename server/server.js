'use strict';

var loopback  = require('loopback');
var boot      = require('loopback-boot');
var mess      = require('./../errorMess/messagse.json');
var app       = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

app.use(function(req, res, next) {
  let accessToken        = req.headers['access-token'];
  let serectKeyModel     = app.models.serectServer;
  let ip                 = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let ipServer           = app.get('ipServer');
  let restApiRoot        = app.get('restApiRoot');
  let urlReuest          = req.url;

  let noAccessToken = [
    `${restApiRoot}/users/login`,
    `${restApiRoot}/users/forgotPassword`,
    `${restApiRoot}/users/checkToken`,
    `${restApiRoot}/users/accessForgotPassword`,
    `${restApiRoot}/emails/sendEmail`,
  ];
 
  if (undefined === ip || undefined === ipServer) return res.json({error: mess.IP_NOT_EXIST, data: null});
  if (ip !== ipServer) return res.json({error: mess.IP_INVALID, data: null});
console.log(noAccessToken.indexOf(urlReuest));
console.log(urlReuest);
  if (noAccessToken.indexOf(urlReuest) === -1) {
    if (undefined === accessToken) return res.json({error: mess.ACCESS_TOKEN_NOT_EXIST, data: '//////'});
    app.models.AccessToken.findById(accessToken, function(err, dataToken) {
      if (err) return res.json({error: mess.SERVER_DISCONNECT, data: null});
      if (null === dataToken) return res.json({error: mess.ACCESS_TOKEN_NOT_EXIST, data: null});
      app.models.Users.findById(dataToken.userId, function(errU, user) {
        if (err) return res.json({error: mess.USER_NOT_EXIST_FOR_TOKEN, data: null});
        if (null === user) return res.json({error: mess.USER_NOT_EXIST_FOR_TOKEN, data: null});
        if (user.status === 0) return res.json({error: mess.USER_DISABLED, data: null});
        app.currentUser = user;
        next();
      });
    });
  } else next();
});

app.get('remoting').errorHandler = { 
  handler: function(error, req, res, next) {    
    if (error instanceof Error) {
      let {message, statusCode, name, ...rest} = error;
      
      res.json({
        error: {
          message,
          statusCode,
          name,
          num: statusCode,
          ...rest
        },
        data: null
      });
    }
    next();
  },
  disableStackTrace: true,
};
