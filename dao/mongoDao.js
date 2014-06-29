'use strict';
/*global require, module, Buffer, jsGen*/

var Thunk = require('thunks')(),
  mongoIp = jsGen.conf.MongodbIp || '127.0.0.1',
  mongoPort = jsGen.conf.MongodbPort || 27017,
  mongoDbName = jsGen.conf.MongodbDefaultDbName || 'jsGen',
  mongoskin = require('mongoskin'),
  db = mongoskin.db('mongodb://' + mongoIp + ':' + mongoPort + '/' + mongoDbName, {
    'native_parser': true,
    'auto_reconnect': true
  });

exports.db = db;
exports.getLatestId = function (collection) {
  return Thunk(function (callback) {
    collection.findOne({}, {
      sort: {
        _id: -1
      },
      hint: {
        _id: 1
      },
      fields: {
        _id: 1
      }
    }, callback);
  });
};