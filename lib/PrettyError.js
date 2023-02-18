var ParsedError, PrettyError, RenderKid, arrayUtils, defaultStyle, instance, isPlainObject, j, len, merge, nodePaths, prop, ref,
  indexOf = [].indexOf;

isPlainObject = require('lodash/isPlainObject');

defaultStyle = require('./defaultStyle');

ParsedError = require('./ParsedError');

nodePaths = require('./nodePaths');

RenderKid = require('renderkid');

merge = require('lodash/merge');

arrayUtils = {
  /*
  pluckByCallback
  */
  pluckByCallback: function(a, cb) {
    var index, j, len, removed, value;
    if (a.length < 1) {
      return a;
    }
    removed = 0;
    for (index = j = 0, len = a.length; j < len; index = ++j) {
      value = a[index];
      if (cb(value, index)) {
        removed++;
        continue;
      }
      if (removed !== 0) {
        a[index - removed] = a[index];
      }
    }
    if (removed > 0) {
      a.length = a.length - removed;
    }
    return a;
  },
  /*
  pluckOneItem
  */
  pluckOneItem: function(a, item) {
    var index, j, len, reached, value;
    if (a.length < 1) {
      return a;
    }
    reached = false;
    for (index = j = 0, len = a.length; j < len; index = ++j) {
      value = a[index];
      if (!reached) {
        if (value === item) {
          reached = true;
          continue;
        }
      } else {
        a[index - 1] = a[index];
      }
    }
    if (reached) {
      a.length = a.length - 1;
    }
    return a;
  }
};

instance = null;

module.exports = PrettyError = (function() {
  var self;

  class PrettyError {
    /*
    _getDefaultStyle
    */
    static _getDefaultStyle() {
      return defaultStyle();
    }

    /*
    start
    */
    static start() {
      if (instance == null) {
        instance = new self();
        instance.start();
      }
      return instance;
    }

    /*
    stop
    */
    static stop() {
      return instance != null ? instance.stop() : void 0;
    }

    /*
    constructor
    */
    constructor() {
      this._useColors = true;
      this._maxItems = 50;
      this._packagesToSkip = [];
      this._pathsToSkip = [];
      this._skipCallbacks = [];
      this._filterCallbacks = [];
      this._parsedErrorFilters = [];
      this._aliases = [];
      this._renderer = new RenderKid();
      this._style = self._getDefaultStyle();
      this._renderer.style(this._style);
    }

    /*
    start
    */
    start() {
      var prepeare;
      this._oldPrepareStackTrace = Error.prepareStackTrace;
      prepeare = this._oldPrepareStackTrace || function(exc, frames) {
        var result;
        result = exc.toString();
        frames = frames.map(function(frame) {
          return `  at ${frame.toString()}`;
        });
        return result + "\n" + frames.join("\n");
      };
      // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
      Error.prepareStackTrace = (exc, trace) => {
        var stack;
        stack = prepeare.apply(null, arguments);
        return this.render({
          stack,
          message: exc.toString().replace(/^.*: /, '')
        }, false);
      };
      return this;
    }

    /*
    stop
    */
    stop() {
      Error.prepareStackTrace = this._oldPrepareStackTrace;
      return this._oldPrepareStackTrace = null;
    }

    /*
    config
    */
    config(c) {
      var alias, path, ref;
      if (c.skipPackages != null) {
        if (c.skipPackages === false) {
          this.unskipAllPackages();
        } else {
          this.skipPackage.apply(this, c.skipPackages);
        }
      }
      if (c.skipPaths != null) {
        if (c.skipPaths === false) {
          this.unskipAllPaths();
        } else {
          this.skipPath.apply(this, c.skipPaths);
        }
      }
      if (c.skip != null) {
        if (c.skip === false) {
          this.unskipAll();
        } else {
          this.skip.apply(this, c.skip);
        }
      }
      if (c.maxItems != null) {
        this.setMaxItems(c.maxItems);
      }
      if (c.skipNodeFiles === true) {
        this.skipNodeFiles();
      } else if (c.skipNodeFiles === false) {
        this.unskipNodeFiles();
      }
      if (c.filters != null) {
        if (c.filters === false) {
          this.removeAllFilters();
        } else {
          this.filter.apply(this, c.filters);
        }
      }
      if (c.parsedErrorFilters != null) {
        if (c.parsedErrorFilters === false) {
          this.removeAllParsedErrorFilters();
        } else {
          this.filterParsedError.apply(this, c.parsedErrorFilters);
        }
      }
      if (c.aliases != null) {
        if (isPlainObject(c.aliases)) {
          ref = c.aliases;
          for (path in ref) {
            alias = ref[path];
            this.alias(path, alias);
          }
        } else if (c.aliases === false) {
          this.removeAllAliases();
        }
      }
      return this;
    }

    /*
    withoutColors
    */
    withoutColors() {
      this._useColors = false;
      return this;
    }

    /*
    withColors
    */
    withColors() {
      this._useColors = true;
      return this;
    }

    /*
    skipPackage
    */
    skipPackage(...packages) {
      var j, len, pkg;
      for (j = 0, len = packages.length; j < len; j++) {
        pkg = packages[j];
        this._packagesToSkip.push(String(pkg));
      }
      return this;
    }

    /*
    unskipPackage
    */
    unskipPackage(...packages) {
      var j, len, pkg;
      for (j = 0, len = packages.length; j < len; j++) {
        pkg = packages[j];
        arrayUtils.pluckOneItem(this._packagesToSkip, pkg);
      }
      return this;
    }

    /*
    unskipAllPackages
    */
    unskipAllPackages() {
      this._packagesToSkip.length = 0;
      return this;
    }

    /*
    skipPath
    */
    skipPath(...paths) {
      var j, len, path;
      for (j = 0, len = paths.length; j < len; j++) {
        path = paths[j];
        this._pathsToSkip.push(path);
      }
      return this;
    }

    /*
    unskipPath
    */
    unskipPath(...paths) {
      var j, len, path;
      for (j = 0, len = paths.length; j < len; j++) {
        path = paths[j];
        arrayUtils.pluckOneItem(this._pathsToSkip, path);
      }
      return this;
    }

    /*
    unskipAllPaths
    */
    unskipAllPaths() {
      this._pathsToSkip.length = 0;
      return this;
    }

    /*
    skip
    */
    skip(...callbacks) {
      var cb, j, len;
      for (j = 0, len = callbacks.length; j < len; j++) {
        cb = callbacks[j];
        this._skipCallbacks.push(cb);
      }
      return this;
    }

    /*
    unskip
    */
    unskip(...callbacks) {
      var cb, j, len;
      for (j = 0, len = callbacks.length; j < len; j++) {
        cb = callbacks[j];
        arrayUtils.pluckOneItem(this._skipCallbacks, cb);
      }
      return this;
    }

    /*
    unskipAll
    */
    unskipAll() {
      this._skipCallbacks.length = 0;
      return this;
    }

    /*
    skipNodeFiles
    */
    skipNodeFiles() {
      return this.skipPath.apply(this, nodePaths);
    }

    /*
    unskipNodeFiles
    */
    unskipNodeFiles() {
      return this.unskipPath.apply(this, nodePaths);
    }

    /*
    filter
    */
    filter(...callbacks) {
      var cb, j, len;
      for (j = 0, len = callbacks.length; j < len; j++) {
        cb = callbacks[j];
        this._filterCallbacks.push(cb);
      }
      return this;
    }

    /*
    removeFilter
    */
    removeFilter(...callbacks) {
      var cb, j, len;
      for (j = 0, len = callbacks.length; j < len; j++) {
        cb = callbacks[j];
        arrayUtils.pluckOneItem(this._filterCallbacks, cb);
      }
      return this;
    }

    /*
    removeAllFilters
    */
    removeAllFilters() {
      this._filterCallbacks.length = 0;
      return this;
    }

    /*
    filterParsedError
    */
    filterParsedError(...callbacks) {
      var cb, j, len;
      for (j = 0, len = callbacks.length; j < len; j++) {
        cb = callbacks[j];
        this._parsedErrorFilters.push(cb);
      }
      return this;
    }

    /*
    removeParsedErrorFilter
    */
    removeParsedErrorFilter(...callbacks) {
      var cb, j, len;
      for (j = 0, len = callbacks.length; j < len; j++) {
        cb = callbacks[j];
        arrayUtils.pluckOneItem(this._parsedErrorFilters, cb);
      }
      return this;
    }

    /*
    removeAllParsedErrorFilters
    */
    removeAllParsedErrorFilters() {
      this._parsedErrorFilters.length = 0;
      return this;
    }

    /*
    setMaxItems
    */
    setMaxItems(maxItems = 50) {
      if (maxItems === 0) {
        maxItems = 50;
      }
      this._maxItems = maxItems | 0;
      return this;
    }

    /*
    alias
    */
    alias(stringOrRx, alias) {
      this._aliases.push({stringOrRx, alias});
      return this;
    }

    /*
    removeAlias
    */
    removeAlias(stringOrRx) {
      arrayUtils.pluckByCallback(this._aliases, function(pair) {
        return pair.stringOrRx === stringOrRx;
      });
      return this;
    }

    /*
    removeAllAliases
    */
    removeAllAliases() {
      this._aliases.length = 0;
      return this;
    }

    /*
    _getStyle
    */
    _getStyle() {
      return this._style;
    }

    /*
    appendStyle
    */
    appendStyle(toAppend) {
      merge(this._style, toAppend);
      this._renderer.style(toAppend);
      return this;
    }

    /*
    _getRenderer
    */
    _getRenderer() {
      return this._renderer;
    }

    /*
    render
    */
    render(e, logIt = false, useColors = this._useColors) {
      var obj, rendered;
      obj = this.getObject(e);
      rendered = this._renderer.render(obj, useColors);
      if (logIt === true) {
        console.error(rendered);
      }
      return rendered;
    }

    /*
    getObject
    */
    getObject(e) {
      var count, header, i, item, j, len, obj, ref, traceItems;
      if (!(e instanceof ParsedError)) {
        e = new ParsedError(e);
      }
      this._applyParsedErrorFiltersOn(e);
      header = {
        title: (function() {
          var ret;
          ret = {};
          // some errors are thrown to display other errors.
          // we call them wrappers here.
          if (e.wrapper !== '') {
            ret.wrapper = `${e.wrapper}`;
          }
          ret.kind = e.kind;
          return ret;
        })(),
        colon: ':',
        message: String(e.message).trim()
      };
      traceItems = [];
      count = -1;
      ref = e.trace;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        item = ref[i];
        if (item == null) {
          continue;
        }
        if (this._skipOrFilter(item, i) === true) {
          continue;
        }
        count++;
        if (count > this._maxItems) {
          break;
        }
        if (typeof item === 'string') {
          traceItems.push({
            item: {
              custom: item
            }
          });
          continue;
        }
        traceItems.push((function() {
          var markupItem;
          markupItem = {
            item: {
              header: {
                pointer: (function() {
                  if (item.file == null) {
                    return '';
                  }
                  return {
                    file: item.file,
                    colon: ':',
                    line: item.line
                  };
                })()
              },
              footer: (function() {
                var foooter;
                foooter = {
                  addr: item.shortenedAddr
                };
                if (item.extra != null) {
                  foooter.extra = item.extra;
                }
                return foooter;
              })()
            }
          };
          if (typeof item.what === 'string' && item.what.trim().length > 0) {
            markupItem.item.header.what = item.what;
          }
          return markupItem;
        })());
      }
      obj = {
        'pretty-error': {
          header: header
        }
      };
      if (traceItems.length > 0) {
        obj['pretty-error'].trace = traceItems;
      }
      return obj;
    }

    /*
    _skipOrFilter
    */
    _skipOrFilter(item, itemNumber) {
      var cb, j, k, l, len, len1, len2, len3, m, modName, pair, ref, ref1, ref2, ref3, ref4, ref5;
      if (typeof item === 'object') {
        if (ref = item.modName, indexOf.call(this._packagesToSkip, ref) >= 0) {
          return true;
        }
        if (ref1 = item.path, indexOf.call(this._pathsToSkip, ref1) >= 0) {
          return true;
        }
        ref2 = item.packages;
        for (j = 0, len = ref2.length; j < len; j++) {
          modName = ref2[j];
          if (indexOf.call(this._packagesToSkip, modName) >= 0) {
            return true;
          }
        }
        if (typeof item.shortenedAddr === 'string') {
          ref3 = this._aliases;
          for (k = 0, len1 = ref3.length; k < len1; k++) {
            pair = ref3[k];
            item.shortenedAddr = item.shortenedAddr.replace(pair.stringOrRx, pair.alias);
          }
        }
      }
      ref4 = this._skipCallbacks;
      for (l = 0, len2 = ref4.length; l < len2; l++) {
        cb = ref4[l];
        if (cb(item, itemNumber) === true) {
          return true;
        }
      }
      ref5 = this._filterCallbacks;
      for (m = 0, len3 = ref5.length; m < len3; m++) {
        cb = ref5[m];
        cb(item, itemNumber);
      }
      return false;
    }

    /*
    _applyParsedErrorFiltersOn
    */
    _applyParsedErrorFiltersOn(error) {
      var cb, j, len, ref;
      ref = this._parsedErrorFilters;
      for (j = 0, len = ref.length; j < len; j++) {
        cb = ref[j];
        cb(error);
      }
    }

  };

  self = PrettyError;

  PrettyError._filters = {
    'module.exports': function(item) {
      if (item.what == null) {
        return;
      }
      item.what = item.what.replace(/\.module\.exports\./g, ' - ');
    }
  };

  return PrettyError;

}).call(this);

ref = ['renderer', 'style'];
for (j = 0, len = ref.length; j < len; j++) {
  prop = ref[j];
  (function() {
    var methodName;
    methodName = '_get' + prop[0].toUpperCase() + prop.substr(1, prop.length);
    return PrettyError.prototype.__defineGetter__(prop, function() {
      return this[methodName]();
    });
  })();
}
