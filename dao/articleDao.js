'use strict';
/*global require, module*/

var Thunk = require('thunks')(),
  Baseco = require('Baseco'),
  JSONKit = require('jsonkit'),
  json = require('./lib/json.js'),
  dao = require('./dao/mongoDao.js'),
  collection = dao.db.bind('articles'),
  union = JSONKit.union,
  intersect = JSONKit.intersect,
  defautArticle = json.Article;

var baseco = new Baseco(62, json.IDString);

exports.convertID = function (id) {
  switch (typeof id) {
    case 'string':
      id = id.substring(1);
      return baseco.gToD(id);
    case 'number':
      id = baseco.dToG(id);
      while (id.length < 3) id = '0' + id;
      return 'A' + id;
  }
};

exports.getArticlesIndex = function (iterator) {
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
        author: 1,
        date: 1,
        display: 1,
        status: 1,
        updateTime: 1,
        hots: 1
      }
    }).each(function (err, doc) {
      if (doc) return iterator(doc);
      callback(err);
    });
  });
};

exports.getArticle = function (_id) {
  return Thunk(function (callback) {
    collection.findOne({
      _id: _id
    }, {
      sort: {
        _id: -1
      },
      fields: {
        author: 1,
        date: 1,
        display: 1,
        status: 1,
        refer: 1,
        title: 1,
        cover: 1,
        content: 1,
        hots: 1,
        visitors: 1,
        updateTime: 1,
        collection: 1,
        tagsList: 1,
        favorsList: 1,
        opposesList: 1,
        markList: 1,
        comment: 1,
        commentsList: 1
      }
    }, callback);
  });
};

exports.setArticle = function (articleObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        author: 0,
        date: 0,
        display: 0,
        status: 0,
        refer: '',
        title: '',
        cover: '',
        content: '',
        hots: 0,
        visitors: 0,
        updateTime: 0,
        collection: 0,
        tagsList: [0],
        comment: true
      };

    intersect(newObj, articleObj);
    setObj.$set = newObj;
    collection.findAndModify({
      _id: articleObj._id
    }, [], setObj, {
      w: 1,
      'new': true
    }, callback);
  });
};

exports.setFavor = function (articleObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        favorsList: 0
      };

    intersect(newObj, articleObj);
    if (newObj.favorsList < 0) {
      newObj.favorsList = -newObj.favorsList;
      setObj.$pull = {
        favorsList: newObj.favorsList
      };
    } else {
      setObj.$push = {
        favorsList: newObj.favorsList
      };
    }

    collection.update({
      _id: articleObj._id
    }, setObj, callback);
  });
};

exports.setOppose = function (articleObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        opposesList: 0
      };

    intersect(newObj, articleObj);
    if (newObj.opposesList < 0) {
      newObj.opposesList = -newObj.opposesList;
      setObj.$pull = {
        opposesList: newObj.opposesList
      };
    } else {
      setObj.$push = {
        opposesList: newObj.opposesList
      };
    }

    collection.update({
      _id: articleObj._id
    }, setObj, callback);
  });
};

exports.setMark = function (articleObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        markList: 0
      };

    intersect(newObj, articleObj);
    if (newObj.markList < 0) {
      newObj.markList = -newObj.markList;
      setObj.$pull = {
        markList: newObj.markList
      };
    } else {
      setObj.$push = {
        markList: newObj.markList
      };
    }

    collection.update({
      _id: articleObj._id
    }, setObj, callback);
  });
};

exports.setComment = function (articleObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        commentsList: 0
      };

    intersect(newObj, articleObj);
    if (newObj.commentsList < 0) {
      newObj.commentsList = -newObj.commentsList;
      setObj.$pull = {
        commentsList: newObj.commentsList
      };
    } else {
      setObj.$push = {
        commentsList: newObj.commentsList
      };
    }

    collection.update({
      _id: articleObj._id
    }, setObj, {
      w: 1
    }, callback);
  });
};

exports.setNewArticle = function (articleObj) {
  return Thunk(function (callback) {
    dao.getLatestId(collection)(function (err, doc) {
      if (err) return callback(err);
      var article = union(defautArticle),
        newArticle = union(defautArticle);

      intersect(article, articleObj);
      union(newArticle, article);
      newArticle._id = doc ? (doc._id + 1) : 1;

      collection.findAndModify({
        _id: newArticle._id
      }, [], newArticle, {
        w: 1,
        upsert: true,
        new: true
      }, callback);
    });
  });
};

exports.delArticle = function (_id) {
  return Thunk(function (callback) {
    collection.remove({
      _id: _id
    }, {
      w: 1
    }, callback);
  });
};
