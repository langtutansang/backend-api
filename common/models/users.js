'use strict';

const randomstring  = require('randomstring');
var mess            = require('./../../errorMess/messagse.json');

module.exports = function(Users) {

  /* VALIDATE feilds */

  let regexE = /^[A-Za-z\d]+[A-Za-z\d_\-.]*[A-Za-z\d]+@([A-Za-z\d]+[A-Za-z\d-]*[A-Za-z\d]+.){1,2}[A-Za-z]{2,}$/g;
  let regexPhone = /^\d{7,15}$/;
  Users.validatesLengthOf('password', {min: 7, max: 100, message: {min: 'Password is too short', max: 'Password is too long'}});
  Users.validatesLengthOf('email', {min: 7, max: 200, message: {min: 'Password is too short', max: 'Password is too long'}});
  Users.validatesFormatOf('email', {with: regexE, message: 'Must provide a valid email'});
  Users.validatesUniquenessOf('email', {message: 'email is not unique'});
  Users.validatesLengthOf('firstname', {min: 3, max: 200, message: {min: 'Firstname is too short', max: 'Firstname is too long'}});
  Users.validatesFormatOf('phone', {with: regexPhone, message: 'Phone invalid'});
  Users.validatesLengthOf('token', {max: 200, message: {max: 'Token is too long'}});
  Users.validatesLengthOf('address', {max: 500, message: {max: 'Address is too long'}});
  Users.validatesInclusionOf('gender', {in: [0, 1]});
  Users.validatesInclusionOf('status', {in: [0, 1]});
  
  /* disableRemoteMethodByName */
  const enabledRemoteMethods = [
    'find', 'login', 'create', 'forgotPassword', 'checkToken', 'resetPassWord',
    'deleteById', 'findById', 'replaceById', 'findOne'
  ];
  Users.sharedClass.methods().forEach(function(method) {
    const methodName = method.stringName.replace(/.*?(?=\.)/, '').substr(1);
    if (enabledRemoteMethods.indexOf(methodName) === -1) {
      Users.disableRemoteMethodByName(methodName);
    }
  });

  /*METHOD SIGNOUT*/
  Users.signOut = function(token, cb) {
    if (token.length !== 64) cb(mess.DATA_NO_MATCH);

    Users.app.models.AccessToken.destroyById(token)
      .then(res => {
        if (null == res) cb(mess.DATA_NOT_DELETED);
        cb(null, res);
      })
      .catch(e => cb(e));
  };

  Users.remoteMethod(
    'signOut', {
      http: {path: '/signOut', verb: 'post'},
      accepts: {arg: 'token', type: 'string', required: true},
      returns: {arg: '', type: 'object', root: true},
    }
  );

  /* METHOD accessForgotPassword*/

  Users.accessForgotPassword = function(data, cb) {
    let { id, token, password } = data;
    let flag      = true;
    
    let pattID    = /^\w{24}$/;
    let pattToken = /^\w{32}$/;
    let pattPass  = /^\w{6,32}$/;

    if (!pattID.test(id)) flag = false;
    if (!pattToken.test(token)) flag = false;
    if (!pattPass.test(password)) flag = false;

    if (flag) {
      Users.findOne({fields: ['id'], where: {'id': id, 'token': token}})
      .then(user => {
        if (!user) return Promise.reject(mess.USER_TOKEN_NOT_EXIST);
        if (user.status === 0) return Promise.reject(mess.USER_DISABLED);
        return Users.upsertWithWhere({'id': id}, {'token': '', 'password': password});
      }, e => Promise.reject(e))
      .then(res => {
        if (!res) return Promise.reject(mess.USER_NOT_EXIST);
        cb(null, res);
      }, e => Promise.reject(e))
      .catch(e => cb(e));

    } else return cb(mess.DATA_NO_MATCH);
  }

  Users.remoteMethod(
    'accessForgotPassword', {
      http: {path: '/accessForgotPassword', verb: 'post'},
      accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
      returns: {arg: 'res', type: 'object', root: true},
    }
  );

  /* METHOD checkToken*/

  Users.checkToken = function(token, cb) {
    let lenToken = 86;

    if (token.length === lenToken) {
      let id      = token.substring(10, 34);
      let active  = token.substring(44, 76);

      id        = id.match(/^[a-f\d]{24}$/)[0];
      active    = active.match(/^[A-Za-z\d]{32}$/)[0];

      Users.findOne({fields: ['id'], where: {id, 'token': active}})
        .then(data => {
          if (null == data || undefined === data.id) return Promise.reject(mess.USER_NOT_EXIST)
          cb(null, {id, token: active});
        })
        .catch(e => cb(e));
    } else return cb({...mess.DATA_NO_MATCH, message: 'Token not exist.'})
  }

  Users.remoteMethod(
    'checkToken', {
      http: {path: '/checkToken', verb: 'post'},
      accepts: {arg: 'token', type: 'string'},
      returns: {arg: 'res', type: 'object', root: true},
    }
  );

  /* METHOD forgotPassword*/
  Users.forgotPassword = function(email, cb) {
    let flag = true;

    let pattEmail  = /^[A-Za-z\d]+[A-Za-z\d_\-\.]*[A-Za-z\d]+@([A-Za-z\d]+[A-Za-z\d\-]*[A-Za-z\d]+\.){1,2}[A-Za-z]{2,}$/g;
    if (!pattEmail.test(email)) flag = false;

    if (flag) {
      Users.findOne({fields: ['id', 'email'], where: {'email': email}})
        .then( user => {
          if (!user) return Promise.reject(mess.USER_NOT_EXIST);
          if (user.status === 0) return Promise.reject(mess.USER_DISABLED);
          let tokenActive   = randomstring.generate(32);
          let {id}   = user;
          return Users.upsertWithWhere({'id': id }, {'token': tokenActive});
        }, e => Promise.reject(e))
        .then(res => {
          if (!res) return Promise.reject(mess.USER_NOT_EXIST);
          let {id, email, token} = res;
          let mailToken     = randomstring.generate(10) + id + randomstring.generate(10) + token + randomstring.generate(10);

          let data = {
            id,
            email,
            mailToken,
          }
          return cb(null, data);
        }, e => Promise.reject(e))
        .catch(e => cb(e));
    } else return cb({...mess.DATA_NO_MATCH, message: 'Email invalid'});
  };

  Users.remoteMethod(
    'forgotPassword', {
      http: {path: '/forgotPassword', verb: 'post'},
      accepts: {arg: 'email', type: 'string'},
      returns: {arg: 'res', type: 'object', root: true},
    }
  );

  /* METHOD getUserInToken*/

  Users.getUserInToken = function(token, cb) {
    if (token.length !== 64) cb(mess.DATA_NO_MATCH);

    Users.app.models.AccessToken.findById(token, {fields: ['userId']})
      .then(res => {
        if (null == res) cb(mess.USER_NOT_EXIST);
        let {userId} = res;
        Users.findById(userId)
          .then(user => {
            if (null == res) cb(mess.USER_NOT_EXIST);
            cb(null, user);
          })
          .catch(err => cb(err));
      })
      .catch(e => cb(e));
  };

  Users.remoteMethod(
    'getUserInToken', {
      http: {path: '/getUserInToken', verb: 'get'},
      accepts: {arg: 'token', type: 'string', required: true},
      returns: {arg: '', type: 'object', root: true},
    }
  );

   /* custom method method update*/

   Users.beforeRemote('prototype.patchAttributes', function(context, res, next) {
    let { password, passNew, repass }  = context.args.data;

    if(undefined != password){ 
      let { id } = context.instance;
      if (undefined == id) next({...mess.DATA_NO_MATCH, messagse: 'User not exist'});
      Users.findById(id, function(err, user){
        if(err) return next({...mess.DATA_NO_MATCH, messagse: 'Password current invalid'});
        if(null == user) return next({...mess.DATA_NO_MATCH, messagse: 'Password current invalid'});
        user.hasPassword(password, function(e, isMacth){
          if (e) return next({...mess.DATA_NO_MATCH, messagse: 'Password current invalid'});
          if (!isMacth) return next({...mess.DATA_NO_MATCH, messagse: 'Password current invalid'});
          if(undefined == passNew || undefined == repass || passNew !== repass) return next({...mess.DATA_NO_MATCH, messagse: 'Password new invalid'});
          context.args.data.password = passNew;
          delete context.args.data.passNew;
          delete context.args.data.repass;

          return next();
        })
      });
    }else next();
  });
  

  /* custom METHOD accessForgotPassword*/

  Users.afterRemote('login', function(req, res, next) { console.log(11111111);
    Users.findById(res.userId, function(err, dt) {
      if (err) next(mess.USER_DISABLED);
      if (null != dt) {
        if (dt.status === 1) next(null, res);
        else next(mess.USER_DISABLED);
      } else next(mess.USER_DISABLED);
    });
  });
};
