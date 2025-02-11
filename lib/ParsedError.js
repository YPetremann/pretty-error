var ParsedError, i, len, prop, ref, sysPath;

sysPath = require("path");

module.exports = ParsedError = class ParsedError {
  /*
  constructor
  */
  constructor(error) {
    this.error = error;
    this._parse();
  }

  /*
  _parse
  */
  _parse() {
    var m;
    this._trace = [];
    this._kind = "Error";
    this._wrapper = "";
    if (this.error.wrapper != null) {
      this._wrapper = String(this.error.wrapper);
    }
    if (typeof this.error !== "object") {
      this._message = String(this.error);
    } else {
      this._stack = this.error.stack;
      if (this.error.kind != null) {
        this._kind = String(this.error.kind);
      } else if (typeof this._stack === "string") {
        if ((m = this._stack.match(/^([a-zA-Z0-9\_\$]+):\ /))) {
          this._kind = m[1];
        }
      }
      this._message =
        (this.error.message != null && String(this.error.message)) || "";
      if (typeof this._stack === "string") {
        this._parseStack();
      }
    }
  }

  /*
  _parseStack
  */
  _parseStack() {
    var i, len, line, message, messageLines, reachedTrace, ref;
    messageLines = [];
    reachedTrace = false;
    ref = this._stack.split("\n");
    for (i = 0, len = ref.length; i < len; i++) {
      line = ref[i];
      if (line.trim() === "") {
        continue;
      }
      if (reachedTrace) {
        this._trace.push(this._parseTraceItem(line));
      } else {
        if (line.match(/^\s*at\s.+/)) {
          reachedTrace = true;
          this._trace.push(this._parseTraceItem(line));
        } else if (!this._message.split("\n".indexOf(line))) {
          messageLines.push(line);
        }
      }
    }
    message = messageLines.join("\n");
    if (message.substr(0, this._kind.length) === this._kind) {
      message = message
        .substr(this._kind.length, message.length)
        .replace(/^\:\s+/, "");
    }
    if (message.length) {
      this._message = this._message.length
        ? [this._message, message].join("\n")
        : message;
    }
  }

  /*
  _parseTraceItem
  */
  _parseTraceItem(text) {
    var addr,
      col,
      d,
      dir,
      file,
      jsCol,
      jsLine,
      line,
      m,
      original,
      packageName,
      packages,
      path,
      r,
      remaining,
      shortenedAddr,
      shortenedPath,
      what;
    text = text.trim();
    if (text === "") {
      return;
    }
    if (!text.match(/^at\ /)) {
      return text;
    }
    // remove the 'at ' part
    text = text.replace(/^at /, "");
    if (
      text === "Error (<anonymous>)" ||
      text === "Error (<anonymous>:null:null)"
    ) {
      return;
    }
    original = text;
    // the part that comes before the address
    what = null;
    // address, including path to module and line/col
    addr = null;
    // path to module
    path = null;
    // module dir
    dir = null;
    // module basename
    file = null;
    // line number (if using a compiler, the line number of the module
    // in that compiler will be used)
    line = null;
    // column, same as above
    col = null;
    // if using a compiler, this will translate to the line number of
    // the js equivalent of that module
    jsLine = null;
    // like above
    jsCol = null;
    // path that doesn't include `node_module` dirs
    shortenedPath = null;
    // like above
    shortenedAddr = null;
    packageName = "[current]";
    // pick out the address
    if ((m = text.match(/\(([^\)]+)\)$/))) {
      addr = m[1].trim();
    }
    if (addr != null) {
      what = text.substr(0, text.length - addr.length - 2);
      what = what.trim();
    }
    // might not have a 'what' clause
    if (addr == null) {
      addr = text.trim();
    }
    addr = this._fixPath(addr);
    remaining = addr;
    // remove the <js> clause if the file is a compiled one
    if ((m = remaining.match(/\,\ <js>:(\d+):(\d+)$/))) {
      jsLine = m[1];
      jsCol = m[2];
      remaining = remaining.substr(0, remaining.length - m[0].length);
    }
    // the line/col part
    if ((m = remaining.match(/:(\d+):(\d+)$/))) {
      line = m[1];
      col = m[2];
      remaining = remaining.substr(0, remaining.length - m[0].length);
      path = remaining;
    }
    // file and dir
    if (path != null) {
      file = sysPath.basename(path);
      dir = sysPath.dirname(path);
      if (dir === ".") {
        dir = "";
      }
      path = this._fixPath(path);
      file = this._fixPath(file);
      dir = this._fixPath(dir);
    }
    if (dir != null) {
      d = dir.replace(/[\\]{1,2}/g, "/");
      if ((m = d.match(/node_modules\/([^\/]+)(?!.*node_modules.*)/))) {
        packageName = m[1];
      }
    }
    if (jsLine == null) {
      jsLine = line;
      jsCol = col;
    }
    if (path != null) {
      r = this._rectifyPath(path);
      shortenedPath = r.path;
      shortenedAddr = shortenedPath + addr.substr(path.length, addr.length);
      packages = r.packages;
    }
    return {
      original: original,
      what: what,
      addr: addr,
      path: path,
      dir: dir,
      file: file,
      line: parseInt(line),
      col: parseInt(col),
      jsLine: parseInt(jsLine),
      jsCol: parseInt(jsCol),
      packageName: packageName,
      shortenedPath: shortenedPath,
      shortenedAddr: shortenedAddr,
      packages: packages || [],
    };
  }

  /*
  getters
  */
  _getMessage() {
    return this._message;
  }

  _getKind() {
    return this._kind;
  }

  _getWrapper() {
    return this._wrapper;
  }

  _getStack() {
    return this._stack;
  }

  _getArguments() {
    return this.error.arguments;
  }

  _getType() {
    return this.error.type;
  }

  _getTrace() {
    return this._trace;
  }

  /*
  _fixPath
  */
  _fixPath(path) {
    return path.replace(/[\\]{1,2}/g, "/");
  }

  /*
  _rectifyPath
  */
  _rectifyPath(path, nameForCurrentPackage) {
    var m, packages, parts, remaining, rest;
    path = String(path);
    remaining = path;
    if (!(m = path.match(/^(.+?)\/node_modules\/(.+)$/))) {
      return {
        path: path,
        packages: [],
      };
    }
    parts = [];
    packages = [];
    if (typeof nameForCurrentPackage === "string") {
      parts.push(`[${nameForCurrentPackage}]`);
      packages.push(`[${nameForCurrentPackage}]`);
    } else {
      parts.push(`[${m[1].match(/([^\/]+)$/)[1]}]`);
      packages.push(m[1].match(/([^\/]+)$/)[1]);
    }
    rest = m[2];
    while ((m = rest.match(/([^\/]+)\/node_modules\/(.+)$/))) {
      parts.push(`[${m[1]}]`);
      packages.push(m[1]);
      rest = m[2];
    }
    if ((m = rest.match(/([^\/]+)\/(.+)$/))) {
      parts.push(`[${m[1]}]`);
      packages.push(m[1]);
      rest = m[2];
    }
    parts.push(rest);
    return {
      path: parts.join("/"),
      packages: packages,
    };
  }
};

ref = ["message", "kind", "arguments", "type", "stack", "trace", "wrapper"];
for (i = 0, len = ref.length; i < len; i++) {
  prop = ref[i];
  (function () {
    var methodName;
    methodName = "_get" + prop[0].toUpperCase() + prop.substr(1, prop.length);
    return Object.defineProperty(ParsedError.prototype, prop, {
      get: function () {
        return this[methodName]();
      },
    });
  })();
}
