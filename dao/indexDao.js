'use strict';
/*global require, module, Buffer, jsGen*/

var Thunk = require('thunks')(),
  JSONKit = require('jsonkit'),
  json = require('./lib/json.js'),
  collection = require('./dao/mongoDao.js').db.bind('global'),
  union = JSONKit.union,
  intersect = JSONKit.intersect,
  GlobalConfig = json.GlobalConfig;


exports.getGlobalConfig = function () {
  return Thunk(function (callback) {
    collection.findOne({
      _id: 'GlobalConfig'
    }, {
      sort: {
        _id: -1
      }
    }, callback);
  });
};

exports.setGlobalConfig = function (Obj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        domain: '',
        beian: '',
        title: '',
        url: '',
        logo: '',
        email: '',
        description: '',
        metatitle: '',
        metadesc: '',
        keywords: '',
        robots: '',
        visitors: 0,
        users: 0,
        articles: 0,
        comments: 0,
        onlineNum: 0,
        onlineUsers: 0,
        maxOnlineNum: 0,
        maxOnlineTime: 0,
        TimeInterval: 0,
        ArticleTagsMax: 0,
        UserTagsMax: 0,
        TitleMinLen: 0,
        TitleMaxLen: 0,
        SummaryMaxLen: 0,
        ContentMinLen: 0,
        ContentMaxLen: 0,
        UserNameMinLen: 0,
        UserNameMaxLen: 0,
        register: true,
        emailVerification: true,
        UsersScore: [0, 0, 0, 0, 0, 0, 0],
        ArticleStatus: [0, 0],
        ArticleHots: [0, 0, 0, 0, 0],
        userCache: 0,
        articleCache: 0,
        commentCache: 0,
        listCache: 0,
        tagCache: 0,
        collectionCache: 0,
        messageCache: 0,
        paginationCache: 0,
        smtp: {
          host: '',
          secureConnection: true,
          port: 0,
          auth: {
            user: '',
            pass: ''
          },
          senderName: '',
          senderEmail: ''
        },
        info: {},
        upload: false,
        cloudDomian: '',
        upyun: {
          url: '',
          bucket: '',
          user: '',
          passwd: '',
          'form_api_secret': ''
        }
      };

    intersect(newObj, Obj);
    setObj.$set = newObj;

    collection.findAndModify({
      _id: 'GlobalConfig'
    }, [], setObj, {
      w: 1,
      'new': true
    }, callback);
  });
};

exports.initGlobalConfig = function () {
  return Thunk(function (callback) {
    GlobalConfig.date = Date.now();
    collection.update({
      _id: 'GlobalConfig'
    }, GlobalConfig, {
      w: 1,
      upsert: true
    }, function (err, reply) {
      callback(err, reply ? GlobalConfig : null);
    });
  });
};