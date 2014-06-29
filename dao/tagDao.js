'use strict';
/*global require, module*/

var Thunk = require('thunks')(),
  Baseco = require('Baseco'),
  JSONKit = require('jsonkit'),
  json = require('./lib/json.js'),
  dao = require('./dao/mongoDao.js'),
  collection = dao.db.bind('tags'),
  union = JSONKit.union,
  intersect = JSONKit.intersect,
  defautTag = json.Tag;

var baseco = new Baseco(62, json.IDString);

exports.convertID = function (id) {
  switch (typeof id) {
    case 'string':
      id = id.substring(1);
      return baseco.gToD(id);
    case 'number':
      id = baseco.dToG(id);
      while (id.length < 3) id = '0' + id;
      return 'T' + id;
  }
};

exports.getTagsNum = function () {
  return Thunk(function (callback) {
    collection.count(callback);
  });
};

exports.getTagsIndex = function (iterator) {
  return Thunk(function (callback) {
    collection.find({}, {
      sort: {
        _id: 1
      },
      hint: {
        _id: 1
      },
      fields: {
        _id: 1,
        tag: 1,
        articles: 1,
        users: 1
      }
    }).each(function (err, doc) {
      if (doc) return iterator(doc);
      callback(err);
    });
  });
};

exports.getTag = function (_id) {
  return Thunk(function (callback) {
    collection.findOne({
      _id: _id
    }, {
      sort: {
        _id: -1
      },
      fields: {
        tag: 1,
        articles: 1,
        articlesList: 1,
        users: 1,
        usersList: 1
      }
    }, callback);
  });
};

exports.setTag = function (tagObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        tag: '',
        articlesList: 0,
        usersList: 0
      };

    newObj = intersect(newObj, tagObj);
    if (newObj.tag) {
      setObj.$set = {
        tag: newObj.tag
      };
    } else if (newObj.articlesList) {
      if (newObj.articlesList < 0) {
        newObj.articlesList = -newObj.articlesList;
        setObj.$inc = {
          articles: -1
        };
        setObj.$pull = {
          articlesList: newObj.articlesList
        };
      } else {
        setObj.$inc = {
          articles: 1
        };
        setObj.$push = {
          articlesList: newObj.articlesList
        };
      }
    } else if (newObj.usersList) {
      if (newObj.usersList < 0) {
        newObj.usersList = -newObj.usersList;
        setObj.$inc = {
          users: -1
        };
        setObj.$pull = {
          usersList: newObj.usersList
        };
      } else {
        setObj.$inc = {
          users: 1
        };
        setObj.$push = {
          usersList: newObj.usersList
        };
      }
    }

    collection.findAndModify({
      _id: tagObj._id
    }, [], setObj, {
      w: 1,
      'new': true
    }, callback);
  });
};

exports.setNewTag = function (tagObj) {
  return Thunk(function (callback) {
    dao.getLatestId(collection)(function (err, doc) {
      if (err) return callback(err);
      var tag = union(defautTag),
        newTag = union(defautTag);

      newTag = intersect(newTag, tagObj);
      newTag = union(tag, newTag);
      newTag._id = doc ? (doc._id + 1) : 1;
      collection.findAndModify({
        _id: newTag._id
      }, [], newTag, {
        w: 1,
        upsert: true,
        'new': true
      }, callback);
    });
  });
};

exports.delTag = function (_id) {
  return Thunk(function (callback) {
    collection.remove({
      _id: _id
    }, {
      w: 1
    }, callback);
  });
};
