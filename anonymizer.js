#!/usr/bin/env node

var crypto = require('crypto');
var fs = require('fs');

var filename = process.argv[2];
var newfilename;
var match;
if (match = filename.match('(.*)[.](.*)')) {
  newfilename = match[1] + 'MANGLED.' + match[2];
  console.log(filename + ' --towards--> ' + newfilename);
} else {
  newfilename = filename + 'MANGLED';
}


var SAFE_STRINGS = [
  'typeId',
  'CPU',
  'uid',
  'title',
  'head',
  'functionName',
  'url',
  'lineNumber',
  'callUID',
  'bailoutReason',
  'id',
  'hitCount',
  'children',
  'startTime',
  'endTime',
  'bottomRoot'
]

SAFE_STRINGS = SAFE_STRINGS.concat(process.argv.slice(3,Infinity))

var INNER_PATTERN = SAFE_STRINGS.map(function(string) { return '(?!' + string + ')' }).join('');

var MANGLE_PATTERN = /^((?!URIError).)*$/
var MANGLE_PATTERN = new RegExp('^' + INNER_PATTERN + '(.*)$');

console.log("Mangling string that match: " + MANGLE_PATTERN);

var SALT_BEFORE = 'AfraidToShootStrangers'
var SALT_AFTER  = 'CanIPlayWithMadness?'

var MANGLE_FUNCTION = function(data_string) {
  var shasum = crypto.createHash('sha1');
  shasum.update(SALT_BEFORE + data_string + SALT_AFTER);

  return shasum.digest('hex');
};

try {
  var content = fs.readFileSync(filename);
  content = content.toString();
  content = JSON.parse(content);
} catch(err) {
  console.log(err);
  process.exit(1);
}

function RecursiveMangle(object, blastEverything) {
  if (typeof object == 'string') {
    if (!!(match = object.match(MANGLE_PATTERN)) || blastEverything) {
      return MANGLE_FUNCTION(object);
    } else {
      return object;
    }
  } else if (typeof object == 'number') {
    return object;
  } else if (object instanceof Array) {
    for (var i=0; i<object.length; i++) {
      object[i] = RecursiveMangle(object[i]);
    }
  } else if (object instanceof Object) {
    for (var i in object) {
      var name = RecursiveMangle(i);
      newChild = RecursiveMangle(object[i]);
      delete object[i];
      object[name] = newChild;
    }
  } else {
    console.log(typeof object);
    console.log(object);
    throw new Error('Object of unknown type');

  }

  return object;
}

content = RecursiveMangle(content, false);

content = JSON.stringify(content, null, '\t');

fs.writeFileSync(newfilename, content);