module.exports = function () {
  return {
    "pretty-error": {
      display: "block",
      marginLeft: "2",
    },
    "pretty-error > header": {
      display: "block",
    },
    "pretty-error > header > title > kind": {
      background: "red",
      color: "bright-white",
    },
    "pretty-error > header > title > wrapper": {
      marginRight: "1",
      color: "grey",
    },
    "pretty-error > header > colon": {
      color: "grey",
      marginRight: 1,
    },
    "pretty-error > header > message": {
      color: "bright-white",
    },
    "pretty-error > trace": {
      display: "block",
      marginTop: 1,
    },
    "pretty-error > trace > item": {
      display: "block",
      marginBottom: 1,
      marginLeft: 2,
      bullet: '"<grey>-</grey>"',
    },
    "pretty-error > trace > item > header": {
      display: "block",
    },
    "pretty-error > trace > item > header > pointer > file": {
      color: "bright-yellow",
    },
    "pretty-error > trace > item > header > pointer > colon": {
      color: "grey",
    },
    "pretty-error > trace > item > header > pointer > line": {
      color: "bright-yellow",
      marginRight: 1,
    },
    "pretty-error > trace > item > header > what": {
      color: "white",
    },
    "pretty-error > trace > item > footer": {
      display: "block",
    },
    "pretty-error > trace > item > footer > addr": {
      display: "block",
      color: "grey",
    },
    "pretty-error > trace > item > footer > extra": {
      display: "block",
      color: "grey",
    },
  };
};
