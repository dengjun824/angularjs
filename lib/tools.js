'use strict';
/*global require, module, Buffer, process, jsGen*/

var crypto = require('crypto'),
    thenjs = require('thenjs'),
    JSONKit = require('jsonkit'),
    msg = require('./msg.js'),
    isArray = Array.isArray,
    breaker = {};

function noop() {}

// 默认的callback函数模板

function callbackFn(err, doc) {
    return err ? console.log(err) : doc;
}

function errorHandler(cont, err) {
    cont(err);
}

//定义jsGen的Error对象

function Err(message, name) {
    var err = new Error();
    err.name = name || msg.MAIN.err;
    err.message = message;
    return err;
}

function resJson(error, data, pagination, otherObj) {
    var result = JSONKit.union({}, otherObj);
    result.ack = !error;
    result.error = error;
    result.timestamp = Date.now();
    result.data = data || null;
    result.pagination = pagination || null;
    return result;
}

function isFunction(fn) {
    return typeof fn === 'function';
}

function parseJSON(str) {
    var obj = null;
    try {
        obj = JSON.parse(str);
    } catch (e) {}
    return typeof obj === 'object' ? obj : null;
}

function isNull(obj) {
    return obj == null || obj !== obj;
}

function isEmpty(obj) {
    if (obj) {
        for (var key in obj) {
            return !hasOwn(obj, key);
        }
    }
    return true;
}

function toStr(value) {
    return (value || value === 0) ? (value + '') : '';
}

function toNum(value) {
    if (isArray(value)) {
        JSONKit.each(value, function (x, i) {
            value[i] = +x || 0;
        });
    } else {
        value = +value || 0;
    }
    return value;
}

function toArray(value) {
    if (!isArray(value)) {
        value = value === undefined ? [] : [value];
    }
    return value;
}

function trim(str, strict) {
    return toStr(str).trim().
    replace(strict ? (/\s+/g) : (/ +/g), ' ').
    replace(/^\s+/, '').
    replace(/\s+$/, '');
}

function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function checkType(obj) {
    var type = typeof obj;
    if (obj === null) {
        return 'null';
    } else if (isArray(obj)) {
        return 'array';
    } else {
        return type;
    }
}

// throttle form underscore.js

function throttle(fn, wait, options) {
    var context, args, result,
        timeout = null,
        previous = 0;

    function later() {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = fn.apply(context, args);
    }

    options = options || {};
    return function () {
        var remaining,
            now = Date.now();
        if (!previous && options.leading === false) {
            previous = now;
        }
        remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = fn.apply(context, args);
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}

function formatMsg(tplStr, contentObj) {
    tplStr = toStr(tplStr);
    JSONKit.each(contentObj, function (value, key) {
        tplStr = tplStr.replace(new RegExp('%' + key, 'gi'), toStr(value));
    });
    return tplStr;
}

function bufferStr(value) {
    return Buffer.isBuffer(value) ? value : toStr(value);
}

function base64(str) {
    var buf = Buffer.isBuffer(str) ? str : new Buffer(toStr(str));
    return buf.toString('base64');
}
//返回 str 的MD5值

function MD5(str, encoding) {
    return crypto.createHash('md5').update(bufferStr(str)).digest(encoding || 'hex');
}

function HmacMD5(str, pwd, encoding) {
    return crypto.createHmac('md5', bufferStr(pwd)).update(bufferStr(str)).digest(encoding || 'hex');
}

//返回 str 的SHA256值

function SHA256(str, encoding) {
    return crypto.createHash('sha256').update(bufferStr(str)).digest(encoding || 'hex');
}

//返回 str 的加密SHA256值，加密密码为 pwd

function HmacSHA256(str, pwd, encoding) {
    return crypto.createHmac('sha256', bufferStr(pwd)).update(bufferStr(str)).digest(encoding || 'hex');
}

//根据email返回gravatar.com的头像链接，returnUrl+'?s=200'则可获取size为200×200的头像

function gravatar(email) {
    return checkEmail(email) && 'http://www.gravatar.com/avatar/$hex'.replace('$hex', MD5(email.toLowerCase()));
}

//检测 str 是否为合法的email格式，返回 true/false

function checkEmail(str) {
    var reg = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;
    return reg.test(str) && str.length >= 6 && str.length <= 64;
}

//检测 str 是否为合法的Url格式，返回 true/false

function checkUrl(str) {
    var reg = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;
    return reg.test(str) && str.length <= 2083;
}

function checkUserID(str) {
    var reg = /^U[a-z]{5,}$/;
    return reg.test(str);
}

function checkUserName(str, minLen, maxLen) {
    var reg = /^[(\u4e00-\u9fa5)a-z][(\u4e00-\u9fa5)a-zA-Z0-9_]{1,15}$/;
    var len = Buffer.byteLength(toStr(str), 'utf8');
    minLen = minLen || jsGen.config.UserNameMinLen;
    maxLen = maxLen || jsGen.config.UserNameMaxLen;
    return reg.test(str) && len >= minLen && len <= maxLen;
}

function checkID(str, idPre) {
    var reg = new RegExp('^' + idPre + '[0-9A-Za-z]{3,}$');
    return reg.test(str);
}

function cutStr(str, maxLen, minLen) {
    str = toStr(str);
    maxLen = maxLen > 0 ? maxLen : 0;
    minLen = minLen > 0 ? minLen : 0;
    var length = Buffer.byteLength(str, 'utf8');
    if (length < minLen) {
        str = '';
    } else if (length > maxLen) {
        var buf = new Buffer(maxLen + 3);
        buf.write(str, 0, 'utf8');
        str = buf.toString('utf8');
        str = str.slice(0, -2) + '…';
    }
    return str;
}

function filterTag(str) {
    str = trim(str, true);
    str = str.replace(/[,，、]/g, '');
    return cutStr(str, 25, 3);
}

function filterTitle(str) {
    var options = {
        whiteList: {},
        onIgnoreTag: function (tag, html) {
            return '';
        }
    };
    str = trim(str, true);
    str = jsGen.module.xss(str, options);
    return cutStr(str, jsGen.config.TitleMaxLen, jsGen.config.TitleMinLen);
}

function filterSummary(str) {
    var options = {
        whiteList: {
            strong: [],
            b: [],
            i: [],
            em: []
        },
        onIgnoreTag: function (tag, html) {
            return '';
        }
    };
    str = jsGen.module.xss(toStr(str), options);
    return cutStr(str, jsGen.config.SummaryMaxLen);
}

function filterContent(str) {
    return cutStr(str, jsGen.config.ContentMaxLen, jsGen.config.ContentMinLen);
}

function paginationList(req, list, cache, callback, errorHandler) {
    var param = req.getparam,
        p = +param.p || +param.pageIndex || 1,
        s = +param.s || +param.pageSize || 10,
        pagination = {},
        data = [];
    callback = callback || callbackFn;
    list = list || [];

    p = p >= 1 ? Math.floor(p) : 1;
    s = s >= 10 && s <= 500 ? Math.floor(s) : 10;
    pagination.total = list.length;
    list = list.slice((p - 1) * s, p * s);
    pagination.pageSize = s;
    pagination.pageIndex = p;
    thenjs.each(list, function (cont, id) {
        cache.getP(+id).fin(function (cont2, err, doc) {
            if (err && typeof errorHandler === 'function') {
                errorHandler(err, id);
            }
            cont(null, doc || null);
        });
    }).fin(function (cont, err, data) {
        JSONKit.removeItem(data, null);
        callback(null, data, pagination);
    });
}

function checkTimeInterval(req, type, set) {
    return thenjs(function (cont) {
        jsGen.cache.timeInterval[set ? 'put' : 'get'](req.session._id + type, set ? 1 : cont, cont);
    });
}

module.exports = {
    MD5: MD5,
    Err: Err,
    noop: noop,
    trim: trim,
    toStr: toStr,
    toNum: toNum,
    base64: base64,
    SHA256: SHA256,
    isEmpty: isEmpty,
    HmacMD5: HmacMD5,
    resJson: resJson,
    toArray: toArray,
    checkID: checkID,
    throttle: throttle,
    gravatar: gravatar,
    checkUrl: checkUrl,
    checkType: checkType,
    parseJSON: parseJSON,
    formatMsg: formatMsg,
    filterTag: filterTag,
    checkEmail: checkEmail,
    HmacSHA256: HmacSHA256,
    callbackFn: callbackFn,
    filterTitle: filterTitle,
    checkUserID: checkUserID,
    errorHandler: errorHandler,
    filterSummary: filterSummary,
    filterContent: filterContent,
    checkUserName: checkUserName,
    paginationList: paginationList,
    checkTimeInterval: checkTimeInterval
};
