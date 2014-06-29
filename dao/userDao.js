'use strict';
/*global require, module, Buffer, jsGen*/

/*
用户数据 mongodb 访问层
convertID(id); 用户显示Uid与MongoDB内部_id之间的转换;
getUsersNum(callback); 获取用户总数量;
getUsersIndex(callback); 获取所有用户的{_id:_id,name:name,email:email}，用于内存缓存以便快速索引;
getLatestId(callback); 获取最新注册用户的_id;
getAuth(_id, callback); 根据_id获取对应用户的认证数据;
getSocial(_id, callback); 根据_id获取对应用户的社交媒体认证数据（weibo\qq\google\baidu）;
getUserInfo(_id, callback); 根据_id获取对应用户详细信息;
setUserInfo(userObj, callback); 批量设置用户信息;
setLoginAttempt(userObj); 记录用户尝试登录的次数（未成功登录）;
setLogin(userObj); 记录用户成功登录的时间和IP;
setSocial(userObj, callback); 设置用户的社交媒体认证数据
setFans(userObj); 增加或减少用户粉丝;
setFollow(userObj, callback); 增加或减少用户关注对象;
setArticle(userObj, callback); 增加或减少用户主题;
setCollection(userObj, callback); 增加或减少用户合集;
setMark(userObj, callback); 增加或减少用户收藏;
setMessages(userObj); 增加或重置用户未读信息;
setReceive(userObj); 增加或减少用户接收的消息;
setSend(userObj); 增加或减少用户发送的消息;
setNewUser(userObj, callback); 注册新用户;
*/

var Thunk = require('thunks')(),
  Baseco = require('Baseco'),
  JSONKit = require('jsonkit'),
  json = require('./lib/json.js'),
  dao = require('./dao/mongoDao.js'),
  collection = dao.db.bind('users'),
  union = JSONKit.union,
  intersect = JSONKit.intersect,
  defautUser = json.User,
  defautUser = json.User,
  preAllocate = json.UserPre;


var baseco = new Baseco(62, json.UIDString);

exports.convertID = function (id) {
  switch (typeof id) {
    case 'string':
      id = id.substring(1);
      return baseco.gToD(id);
    case 'number':
      id = baseco.dToG(id);
      while (id.length < 3) id = '0' + id;
      return 'U' + id;
  }
};

exports.getUsersNum = function (callback) {
  return Thunk(function (callback) {
    collection.count(callback);
  });
};

exports.getUsersIndex = function (iterator) {
  return Thunk(function (callback) {
    collection.find({}, {
      sort: {
        _id: -1
      },
      hint: {
        _id: 1
      },
      fields: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1
      }
    }).each(function (err, doc) {
      if (doc) return iterator(doc);
      callback(err);
    });
  });
};

exports.getFullUsersIndex = function (iterator) {
  return Thunk(function (callback) {
    collection.find({}, {
      sort: {
        _id: -1
      },
      hint: {
        _id: 1
      }
    }).each(function (err, doc) {
      if (doc) return iterator(doc);
      callback(err);
    });
  });
};

exports.getAuth = function (_id) {
  return Thunk(function (callback) {
    collection.findOne({
      _id: _id
    }, {
      fields: {
        _id: 1,
        passwd: 1,
        resetKey: 1,
        resetDate: 1,
        loginAttempts: 1,
        locked: 1
      }
    }, callback);
  });
};

exports.getSocial = function (_id) {
  return Thunk(function (callback) {
    collection.findOne({
      _id: _id
    }, {
      fields: {
        name: 1,
        email: 1,
        social: 1
      }
    }, callback);
  });
};

exports.getUserInfo = function (_id) {
  return Thunk(function (callback) {
    collection.findOne({
      _id: _id
    }, {
      fields: {
        passwd: 0,
        resetKey: 0,
        resetDate: 0,
        loginAttempts: 0,
        login: 0,
        allmsg: 0
      }
    }, callback);
  });
};

exports.setUserInfo = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        name: '',
        email: '',
        passwd: '',
        resetKey: '',
        resetDate: 0,
        locked: false,
        sex: '',
        role: 0,
        avatar: '',
        desc: '',
        score: 0,
        readtimestamp: 0,
        tagsList: [0]
      };

    newObj = intersect(newObj, userObj);
    setObj.$set = newObj;
    collection.findAndModify({
      _id: userObj._id
    }, [], setObj, {
      w: 1,
      'new': true
    }, callback);
  });
};

exports.setLoginAttempt = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        loginAttempts: 0
      };

    newObj = intersect(newObj, userObj);
    if (newObj.loginAttempts === 0) {
      setObj.$set = newObj;
    } else {
      setObj.$inc = {
        loginAttempts: 1
      };
    }

    collection.update({
      _id: userObj._id
    }, setObj, callback);
  });
};

exports.setLogin = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        lastLoginDate: 0,
        login: {
          date: 0,
          ip: ''
        }
      };

    newObj = intersect(newObj, userObj);
    setObj.$set = {
      lastLoginDate: newObj.lastLoginDate
    };
    setObj.$push = {
      login: newObj.login
    };
    collection.update({
        _id: userObj._id
    }, setObj, callback);
  });
};

exports.setSocial = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {
      $set: {
        'social.weibo': {},
        'social.qq': {},
        'social.google': {},
        'social.baidu': {}
      }
    },
      newObj = {
        social: {
          weibo: {
            id: '',
            name: ''
          },
          qq: {
            id: '',
            name: ''
          },
          google: {
            id: '',
            name: ''
          },
          baidu: {
            id: '',
            name: ''
          }
        }
      };

    newObj = intersect(newObj, userObj);
    if (newObj.social.weibo) {
      setObj.$set['social.weibo'] = newObj.social.weibo;
    } else {
      delete setObj.$set['social.weibo'];
    }
    if (newObj.social.qq) {
      setObj.$set['social.qq'] = newObj.social.qq;
    } else {
      delete setObj.$set['social.qq'];
    }
    if (newObj.social.google) {
      setObj.$set['social.google'] = newObj.social.google;
    } else {
      delete setObj.$set['social.google'];
    }
    if (newObj.social.baidu) {
      setObj.$set['social.baidu'] = newObj.social.baidu;
    } else {
      delete setObj.$set['social.baidu'];
    }

    collection.update({
      _id: userObj._id
    }, setObj, {
      w: 1
    }, callback);
  });
};

exports.setFans = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        fansList: 0
      };

    newObj = intersect(newObj, userObj);
    if (newObj.fansList < 0) {
      newObj.fansList = -newObj.fansList;
      setObj.$inc = {
        fans: -1
      };
      setObj.$pull = {
        fansList: newObj.fansList
      };
    } else {
      setObj.$inc = {
        fans: 1
      };
      setObj.$push = {
        fansList: newObj.fansList
      };
    }

    collection.update({
      _id: userObj._id
    }, setObj, callback);
  });
};

exports.setFollow = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        followList: 0
      };

    newObj = intersect(newObj, userObj);
    if (newObj.followList < 0) {
      newObj.followList = -newObj.followList;
      setObj.$inc = {
        follow: -1
      };
      setObj.$pull = {
        followList: newObj.followList
      };
    } else {
      setObj.$inc = {
        follow: 1
      };
      setObj.$push = {
        followList: newObj.followList
      };
    }

    collection.update({
      _id: userObj._id
    }, setObj, {
      w: 1
    }, callback);
  });
};

exports.setArticle = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        articlesList: 0
      };

    newObj = intersect(newObj, userObj);
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

    collection.update({
      _id: userObj._id
    }, setObj, {
      w: 1
    }, callback);
  });
};

exports.setCollection = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        collectionsList: 0
      };

    newObj = intersect(newObj, userObj);
    if (newObj.collectionsList < 0) {
      newObj.collectionsList = -newObj.collectionsList;
      setObj.$inc = {
        collections: -1
      };
      setObj.$pull = {
        collectionsList: newObj.collectionsList
      };
    } else {
      setObj.$inc = {
        collections: 1
      };
      setObj.$push = {
        collectionsList: newObj.collectionsList
      };
    }

    collection.update({
      _id: userObj._id
    }, setObj, {
      w: 1
    }, callback);
  });
};

exports.setMark = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        markList: 0
      };

    newObj = intersect(newObj, userObj);
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
      _id: userObj._id
    }, setObj, callback);
  });
};

exports.setMessages = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        unread: {},
        allmsg: {}
      };

    newObj = intersect(newObj, userObj);
    setObj.$push = {
      unread: newObj.unread,
      allmsg: newObj.allmsg
    };

    collection.update({
        _id: userObj._id
    }, setObj, callback);
  });
};

exports.delMessages = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        unread: {},
        allmsg: {}
      };

    newObj = intersect(newObj, userObj);
    if (newObj.receiveList < 0) {
      newObj.receiveList = -newObj.receiveList;
      setObj.$pull = {
        receiveList: newObj.receiveList
      };
    } else {
      setObj.$push = {
        receiveList: newObj.receiveList
      };
    }

    collection.update({
        _id: userObj._id
    }, setObj, callback);
  });
};

exports.setReceive = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        receiveList: 0
      };

    newObj = intersect(newObj, userObj);
    if (newObj.receiveList < 0) {
      newObj.receiveList = -newObj.receiveList;
      setObj.$pull = {
        receiveList: newObj.receiveList
      };
    } else {
      setObj.$push = {
        receiveList: newObj.receiveList
      };
    }

    collection.update({
      _id: userObj._id
    }, setObj, callback);
  });
};

exports.setSend = function (userObj) {
  return Thunk(function (callback) {
    var setObj = {},
      newObj = {
        sendList: 0
      };

    newObj = intersect(newObj, userObj);
    if (newObj.sendList < 0) {
      newObj.sendList = -newObj.sendList;
      setObj.$pull = {
        sendList: newObj.sendList
      };
    } else {
      setObj.$push = {
        sendList: newObj.sendList
      };
    }

    collection.update({
      _id: userObj._id
    }, setObj, callback);
  });
};

exports.setNewUser = function (userObj) {
  return Thunk(function (callback) {
    dao.getLatestId(collection)(function (err, doc) {
      if (err) return callback(err);
      var user = union(defautUser),
        newUser = union(defautUser);

      newUser = intersect(newUser, userObj);
      newUser = union(user, newUser);
      newUser.date = Date.now();
      newUser.lastLoginDate = newUser.date;
      newUser.readtimestamp = newUser.date;

      if (!doc) {
        preAllocate._id = newUser._id || 1;
      } else {
        preAllocate._id = doc._id + 1;
      }
      delete newUser._id;
      collection.insert(preAllocate, {
        w: 1
      }, function (err, doc) {
        if (err) return callback(err);
        collection.findAndModify({
          _id: preAllocate._id
        }, [], newUser, {
          w: 1,
          'new': true
        }, callback);
      });
    });
  });
};
