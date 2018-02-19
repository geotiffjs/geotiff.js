'use strict';

/* 
	Some parts of this file are based on UTIF.js,
	which was released under the MIT License.
	You can view that here:
	https://github.com/photopea/UTIF.js/blob/master/LICENSE
*/


var globals = require("./globals.js");

var _ = require("lodash");
var assign = _.assign;
var endsWith = _.endsWith;
var isUndefined = _.isUndefined;
var forEach = _.forEach;
var invert = _.invert;
var map = _.map;
var times = _.times;

var code2typeName = globals.fieldTagTypes;
var tagName2Code = invert(globals.fieldTagNames);
var geoKeyName2Code = invert(globals.geoKeyNames);

var name2code = {};
assign(name2code, tagName2Code);
assign(name2code, geoKeyName2Code);

var typeName2byte = invert(globals.fieldTypeNames);

//config variables
var num_bytes_in_ifd = 1000;


var stringify = function (obj) {
	if (obj.length) {
		return JSON.stringify(map(obj));
	}
	else {
		return JSON.stringify(obj);
	}
};

var _binBE = {
	nextZero: function (data, o) {
		while (data[o] !== 0) {
			o++;
		}
		return o;
	},
	readUshort: function (buff, p) {
		return (buff[p] << 8) | buff[p + 1];
	},
	readShort: function (buff, p) {
		var a = _binBE.ui8;
		a[0] = buff[p + 1];
		a[1] = buff[p + 0];
		return _binBE.i16[0];
	},
	readInt: function (buff, p) {
		var a = _binBE.ui8;
		a[0] = buff[p + 3];
		a[1] = buff[p + 2];
		a[2] = buff[p + 1];
		a[3] = buff[p + 0];
		return _binBE.i32[0];
	},
	readUint: function (buff, p) {
		var a = _binBE.ui8;
		a[0] = buff[p + 3];
		a[1] = buff[p + 2];
		a[2] = buff[p + 1];
		a[3] = buff[p + 0];
		return _binBE.ui32[0];
	},
	readASCII: function (buff, p, l) {
		return l.map(function (i) {
			return String.fromCharCode(buff[p + i]);
		}).join("");
	},
	readFloat: function (buff, p) {
		var a = _binBE.ui8;
		times(4, function (i) { a[i] = buff[p + 3 - i]; });
		return _binBE.fl32[0];
	},
	readDouble: function (buff, p) {
		var a = _binBE.ui8;
		times(8, function (i) { a[i] = buff[p + 7 - i]; });
		return _binBE.fl64[0];
	},
	writeUshort: function (buff, p, n) {
		buff[p] = (n >> 8) & 255;
		buff[p + 1] = n & 255;
	},
	writeUint: function (buff, p, n) {
		buff[p] = (n >> 24) & 255;
		buff[p + 1] = (n >> 16) & 255;
		buff[p + 2] = (n >> 8) & 255;
		buff[p + 3] = (n >> 0) & 255;
	},
	writeASCII: function (buff, p, s) {
		times(s.length, function (i) {
			buff[p + i] = s.charCodeAt(i);
		});
	},
	ui8: new Uint8Array(8)
};
_binBE.fl64 = new Float64Array(_binBE.ui8.buffer);
_binBE.writeDouble = function (buff, p, n) {
	_binBE.fl64[0] = n;
	times(8, function (i) {
		buff[p + i] = _binBE.ui8[7 - i];
	});
};



var _writeIFD = function (bin, data, offset, ifd) {

	var keys = Object.keys(ifd).filter(function (key) {
		return key !== undefined && key !== null && key !== "undefined";
	});

	bin.writeUshort(data, offset, keys.length);
	offset += 2;

	var eoff = offset + 12 * keys.length + 4;

	keys.forEach(function (key) {

		var tag = typeof key === "number" ? key : typeof key === "string" ? parseInt(key) : null;

		var typeName = code2typeName[tag];
		var typeNum = typeName2byte[typeName];

		if (typeName == null || typeName === undefined || typeof typeName === "undefined") {
			throw "unknown type of tag: " + tag;
		}

		var val = ifd[key];

		if (typeof val === 'undefined') {
			throw "failed to get value for key " + key;
		}

		// ASCIIZ format with trailing 0 character
		// http://www.fileformat.info/format/tiff/corion.htm
		// https://stackoverflow.com/questions/7783044/whats-the-difference-between-asciiz-vs-ascii
		if (typeName === "ASCII" && typeof val === "string" && endsWith(val, "\u0000") === false) {
			val += "\u0000";
		}

		var num = val.length;

		bin.writeUshort(data, offset, tag);
		offset += 2;

		bin.writeUshort(data, offset, typeNum);
		offset += 2;

		bin.writeUint(data, offset, num);
		offset += 4;

		var dlen = [-1, 1, 1, 2, 4, 8, 0, 0, 0, 0, 0, 0, 8][typeNum] * num;
		var toff = offset;

		if (dlen > 4) {
			bin.writeUint(data, offset, eoff);
			toff = eoff;
		}

		if (typeName === "ASCII") {
			bin.writeASCII(data, toff, val);
		}
		else if (typeName === "SHORT") {
			times(num, function (i) {
				bin.writeUshort(data, toff + 2 * i, val[i]);
			});
		}
		else if (typeName === "LONG") {
			times(num, function (i) {
				bin.writeUint(data, toff + 4 * i, val[i]);
			});
		}
		else if (typeName === "RATIONAL") {
			times(num, function (i) {
				bin.writeUint(data, toff + 8 * i, Math.round(val[i] * 10000));
				bin.writeUint(data, toff + 8 * i + 4, 10000);
			});
		}
		else if (typeName === "DOUBLE") {
			times(num, function (i) {
				bin.writeDouble(data, toff + 8 * i, val[i]);
			});
		}

		if (dlen > 4) {
			dlen += (dlen & 1);
			eoff += dlen;
		}

		offset += 4;

	});

	return [offset, eoff];
};

var encode_ifds = function (ifds) {

	var data = new Uint8Array(num_bytes_in_ifd);
	var offset = 4;
	var bin = _binBE;

	// set big-endian byte-order
	// https://en.wikipedia.org/wiki/TIFF#Byte_order
	data[0] = 77;
	data[1] = 77;

	// set format-version number
	// https://en.wikipedia.org/wiki/TIFF#Byte_order
	data[3] = 42;

	var ifdo = 8;

	bin.writeUint(data, offset, ifdo);

	offset += 4;

	ifds.forEach(function (ifd, i) {
		var noffs = _writeIFD(bin, data, ifdo, ifd);
		ifdo = noffs[1];
		if (i < ifds.length - 1) {
			bin.writeUint(data, noffs[0], ifdo);
		}
	});

	if (data.slice) {
		return data.slice(0, ifdo).buffer;
	}
	else {
		// node hasn't implemented slice on Uint8Array yet 
		var result = new Uint8Array(ifdo);
		for (var i = 0; i < ifdo; i++) {
			result[i] = data[i];
		}
		return result.buffer;
	}
};

var encodeImage = function (values, width, height, metadata) {

	if (height === undefined || height === null) {
		throw `you passed into encodeImage a width of type ${height}`;
	}

	if (width === undefined || width === null) {
		throw `you passed into encodeImage a width of type ${width}`;
	}

	var ifd = {
		256: [width],
		257: [height],
		258: [8, 8, 8, 8],
		259: [1],
		262: [2],
		273: [num_bytes_in_ifd], // strips offset
		277: [4],
		278: [height],
		/* rows per strip */
		279: [width * height * 4], // strip byte counts
		284: [1],
		286: [0],
		287: [0],
		305: "geotiff.js", // no array for ASCII(Z)
		338: [1]
	};

	if (metadata) {
		for (var i in metadata) {
			ifd[i] = metadata[i];
		}
	}

	var prfx = new Uint8Array(encode_ifds([ifd]));

	var img = new Uint8Array(values);

	let samplesPerPixel = ifd[277];

	var data = new Uint8Array(num_bytes_in_ifd + width * height * samplesPerPixel);
	times(prfx.length, function (i) { data[i] = prfx[i]; });
	forEach(img, function (value, i) {
		data[num_bytes_in_ifd + i] = value;
	});

	return data.buffer;
};





var convert_to_tids = function (input) {

	var result = {};
	for (var key in input) {
		if (key !== "StripOffsets") {
			if (!name2code[key]) {
				console.error(key, "not in name2code:", Object.keys(name2code));
			}
			result[name2code[key]] = input[key];
		}
	}
	return result;
};



var toArray = function (input) {
	if (Array.isArray(input)) {
		return input;
	}
	else {
		return [input];
	}
};

var write_geotiff = function (data, metadata) {

	var number_of_bands = data.length;

	var isFlattened = typeof data[0] === 'number';

	var height;
	var width;
	var flattenedValues;

	if (isFlattened) {
		height = metadata.height || metadata.ImageLength;
		width = metadata.width || metadata.ImageWidth;
		flattenedValues = data;
	}
	else {
		height = data[0].length;
		width = data[0][0].length;
		flattenedValues = [];
		times(height, function (row_index) {
			times(width, function (column_index) {
				times(number_of_bands, function (band_index) {
					flattenedValues.push(data[band_index][row_index][column_index]);
				});
			});
		});
	}

	metadata.ImageLength = height;
	metadata.ImageWidth = width;

	//consult https://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml

	if (!metadata.BitsPerSample) {
		metadata.BitsPerSample = times(number_of_bands, function (i) { return 8; });
	}

	if (!metadata.Compression) {
		metadata.Compression = [1]; //no compression
	}

	// The color space of the image data.
	// 1=black is zero and 2=RGB. 
	if (!metadata.PhotometricInterpretation) {
		metadata.PhotometricInterpretation = metadata.bitsPerSample.length === 3 ? 2 : 1;
	}
	// For each strip, the byte offset of that strip.
	//if (!metadata.StripOffsets) metadata.StripOffsets = [2000];  // assumes there's only 1 strip
	//metadata.StripOffsets = toArray(metadata.StripOffsets);

	//The number of components per pixel.
	if (!metadata.SamplesPerPixel) {
		metadata.SamplesPerPixel = [number_of_bands];
	}
	//if (!metadata.RowsPerStrip) metadata.RowsPerStrip = [height]; // assumes there's only 1 strip
	//metadata.RowsPerStrip = toArray(metadata.RowsPerStrip);

	//if (!metadata.StripByteCounts) metadata.StripByteCounts = [height * width * 4]; // assumes 8-bit
	//metadata.StripByteCounts = toArray(metadata.StripByteCounts);

	if (!metadata.PlanarConfiguration) {
		metadata.PlanarConfiguration = [1]; //no compression
	}
	if (!metadata.XPosition) {
		metadata.XPosition = [0];
	}
	if (!metadata.YPosition) {
		metadata.YPosition = [0];
	}

	// Code 1 for actual pixel count or 2 for pixels per inch.
	if (!metadata.ResolutionUnit) {
		metadata.ResolutionUnit = [1];
	}


	// For example, full-color RGB data normally has SamplesPerPixel=3. If SamplesPerPixel is greater than 3, then the ExtraSamples field describes the meaning of the extra samples. If SamplesPerPixel is, say, 5 then ExtraSamples will contain 2 values, one for each extra sample. ExtraSamples is typically used to include non-color information, such as opacity, in an image. The possible values for each item in the field's value are:
	if (!metadata.ExtraSamples) {
		metadata.ExtraSamples = [0];
	}

	//if (!metadata.GTModelTypeGeoKey) metadata.GTModelTypeGeoKey = [0];

	//if (!metadata.GTModelTypeGeoKey) metadata.GTModelTypeGeoKey = [0];

	[
		"Compression",
		"ExtraSamples",
		"GeographicTypeGeoKey",
		"GTModelTypeGeoKey",
		"GTRasterTypeGeoKey",
		"ImageLength", // synonym of ImageHeight
		"ImageWidth",
		"PhotometricInterpretation",
		"PlanarConfiguration",
		"ResolutionUnit",
		"SamplesPerPixel",
		"XPosition",
		"YPosition"
	].forEach(function (name) {
		if (metadata[name]) {
			metadata[name] = toArray(metadata[name]);
		}
	});


	var encoded_metadata = convert_to_tids(metadata);

	var output_image = encodeImage(flattenedValues, width, height, encoded_metadata);

	return output_image;
};

module.exports = { write_geotiff: write_geotiff };
