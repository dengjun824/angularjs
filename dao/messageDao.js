'use strict';
/*global require, module*/

var Thunk = require('thunks')(),
  Baseco = require('Baseco'),
  JSONKit = require('jsonkit'),
  json = require('./lib/json.js'),
  dao = require('./dao/mongoDao.js'),
  collection = dao.db.bind('messages'),
  union = JSONKit.union,
  intersect = JSONKit.intersect,
  defautMessage = json.Message;

var baseco = new Baseco(62, json.IDString);

exports.convertID = function (id) {
  switch (typeof id) {
    case 'string':
      id = id.substring(1);
      return baseco.gToD(id);
    case 'number':
      id = baseco.dToG(id);
      while (id.length < 3) id = '0' + id;
      return 'M' + id;
  }
};

exports.getMessagesNum = function () {
  return Thunk(function (callback) {
    collection.count(callback);
  });
};

exports.getMessagesList = function (_idArray) {
  return Thunk(function (callback) {
    if (!Array.isArray(_idArray)) _idArray = [_idArray];

    collection.find({
      _id: {
        $in: _idArray
      }
    }, {
      fields: {
        author: 1,
        date: 1,
        title: 1,
        content: 1
      }
    }).toArray(callback);
  });
};

exports.getMessage = function (_id) {
  return Thunk(function (callback) {
    collection.findOne({
      _id: _id
    }, {
      sort: {
        _id: -1
      },
      fields: {
        author: 1,
        receiver: 1,
        date: 1,
        title: 1,
        content: 1
      }
    }, callback);
  });
};

exports.setMessage = function (messageObj) {
  return Thunk(function (callback) {
    var query = {},
      setObj = {},
      newObj = {
        receiver: {
          _id: 0,
          read: false
        }
      };

    newObj = intersect(newObj, messageObj);

    collection.update({
      _id: messageObj._id,
      'receiver._id': newObj.receiver._id
    }, {
      $set: {
        'receiver.$.read': true
      }
    }, callback);
  });
};

exports.setNewMessage = function (messageObj) {
  return Thunk(function (callback) {
    dao.getLatestId(collection)(function (err, doc) {
      if (err) return callback(err);
      var message = union(defautMessage),
        newMessage = union(defautMessage);

      newMessage = intersect(newMessage, messageObj);
      newMessage = union(message, newMessage);
      newMessage.date = Date.now();
      newMessage._id = doc ? (doc._id + 1) : 1;
      collection.insert(newMessage, {w: 1}, callback);
    });
  });
};

exports.delMessage = function (_id) {
  return Thunk(function (callback) {
    collection.remove({
      _id: _id
    }, {
      w: 1
    }, callback);
  });
};
