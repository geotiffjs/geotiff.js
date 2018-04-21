
var assign = function(target, source) {
	for (var key in source) {
		if (source.hasOwnProperty(key)) {
			target[key] = source[key];
		}
	}
};

var chunk = function(iterable, length) {
    var results = [];
    var length_of_iterable = iterable.length;
    for (var i = 0; i < length_of_iterable; i+=length) {
				var chunk = [];
				for (var ci = i; ci < i + length; ci++) {
					chunk.push(iterable[ci]);
				}
				results.push(chunk);
    }
    return results;
};

var endsWith = function(string, expected_ending) {
	if (string.length < expected_ending.length) {
		return false;
	} else {
		var actual_ending = string.substr(string.length - expected_ending.length);
		return actual_ending === expected_ending;
	}
};

var forEach = function(iterable, func) {
	var length = iterable.length;
	for (var i = 0; i < length; i++) {
		func(iterable[i], i);
	}
};

var invert = function(old_obj) {
	var new_obj = {};
	for (var key in old_obj) {
		if (old_obj.hasOwnProperty(key)) {
			var value = old_obj[key];
			new_obj[value] = key;
		}
	}
	return new_obj;
};

var range = function(n) {
    var results = [];
    for (var i = 0; i < n; i++) {
        results.push(i);
    }
    return results;
};

var times = function(times, func) {
    var results = [];
    for (var i = 0; i < times; i++){
        results.push(func(i));
    }
    return results;
};

var toArray = function(iterable) {
    var results = [];
    var length = iterable.length;
    for (var i = 0; i < length; i++) {
        results.push(iterable[i]);
    }
    return results;
};

module.exports = {
  assign: assign,
  chunk: chunk,
  endsWith: endsWith,
  forEach: forEach,
  invert: invert,
  range: range,
  times: times,
  toArray: toArray,
};
