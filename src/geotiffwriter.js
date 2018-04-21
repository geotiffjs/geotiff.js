'use strict';

/*
	Some parts of this file are based on UTIF.js,
	which was released under the MIT License.
	You can view that here:
	https://github.com/photopea/UTIF.js/blob/master/LICENSE
*/


var globals = require("./globals.js");

var utils = require("./utils");
var assign = utils.assign;
var endsWith = utils.endsWith;
var forEach = utils.forEach;
var invert = utils.invert;
var times = utils.times;

var fieldTagTypes = globals.fieldTagTypes;

var tagName2Code = invert(globals.fieldTagNames);
var geoKeyName2Code = invert(globals.geoKeyNames);

var name2code = {};
assign(name2code, tagName2Code);
assign(name2code, geoKeyName2Code);

var typeName2byte = invert(globals.fieldTypeNames);

//config variables
var num_bytes_in_ifd = 1000;

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

		var typeName = fieldTagTypes[tag];
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
		256: [width], // ImageWidth
		257: [height], // ImageLength
		273: [num_bytes_in_ifd], // strips offset
		278: [height], // RowsPerStrip
		305: "geotiff.js" // no array for ASCII(Z)
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

var metadata_defaults = [
	[ "Compression", 1 ], //no compression
	[ "PlanarConfiguration", 1 ],
	[ "XPosition", 0 ],
	[ "YPosition", 0 ],
	[ "ResolutionUnit", 1 ], // Code 1 for actual pixel count or 2 for pixels per inch.
	[ "ExtraSamples", 0 ], // should this be an array??
	[ "GeoAsciiParams", "WGS 84\u0000" ],
	[ "ModelTiepoint", [0, 0, 0, -180, 90, 0] ], // raster fits whole globe
	[ "GTModelTypeGeoKey", 2 ],
	[ "GTRasterTypeGeoKey", 1 ],
	[ "GeographicTypeGeoKey", 4326 ],
	[ "GeogCitationGeoKey", "WGS 84"]
];

var write_geotiff = function (data, metadata) {

	var isFlattened = typeof data[0] === 'number';

	var height;
	var number_of_bands;
	var width;
	var flattenedValues;

	if (isFlattened) {
		height = metadata.height || metadata.ImageLength;
		width = metadata.width || metadata.ImageWidth;
		number_of_bands = data.length / (height * width);
		flattenedValues = data;
	}
	else {
		number_of_bands = data.length;
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
	delete metadata.height;
	metadata.ImageWidth = width;
	delete metadata.width;

	//consult https://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml

	if (!metadata.BitsPerSample) {
		metadata.BitsPerSample = times(number_of_bands, function (i) { return 8; });
	}

	metadata_defaults.forEach(tag => {
		var key = tag[0];
		if (!metadata[key]) {
			var value = tag[1];
			metadata[key] = value;
		}
	});

	// The color space of the image data.
	// 1=black is zero and 2=RGB.
	if (!metadata.PhotometricInterpretation) {
		metadata.PhotometricInterpretation = metadata.BitsPerSample.length === 3 ? 2 : 1;
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

	if (!metadata.StripByteCounts) {
		// we are only writing one strip
		metadata.StripByteCounts = [number_of_bands * height * width];
	}

	if (!metadata.ModelPixelScale) {
		// assumes raster takes up exactly the whole globe
		metadata.ModelPixelScale = [360 / width, 180 / height, 0];
	}

	if (!metadata.SampleFormat) {
		metadata.SampleFormat = times(number_of_bands, function(i) { return 1; });
	}


	var geoKeys = Object.keys(metadata)
	.filter(function(key) {
		return endsWith(key, "GeoKey");
	})
	.sort(function(a, b) {
		return name2code[a] - name2code[b];
	});

	if (!metadata.GeoKeyDirectory) {
		// Header={KeyDirectoryVersion, KeyRevision, MinorRevision, NumberOfKeys}
		//     "GeoKeyDirectory": [1, 1, 0, 5, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2049, 34737, 7, 0, 2054, 0, 1, 9102],
		var KeyDirectoryVersion = 1;
		var KeyRevision = 1;
		var MinorRevision = 0;

		var NumberOfKeys = geoKeys.length;

		var GeoKeyDirectory = [ 1, 1, 0, NumberOfKeys ];
		geoKeys.forEach(function(geoKey) {
			var KeyID = Number(name2code[geoKey]);
			GeoKeyDirectory.push(KeyID);

			var Count;
			var TIFFTagLocation;
			var Value_Offset;
			if (fieldTagTypes[KeyID] === "SHORT") {
				Count = 1;
				TIFFTagLocation = 0;
				Value_Offset = metadata[geoKey];
			} else if (geoKey === "GeogCitationGeoKey") {
				Count = metadata.GeoAsciiParams.length;
				TIFFTagLocation = Number(name2code.GeoAsciiParams);
				Value_Offset = 0;
			} else {
				console.log("[geotiff.js] couldn't get TIFFTagLocation for " + geoKey);
			}
			GeoKeyDirectory.push(TIFFTagLocation);
			GeoKeyDirectory.push(Count);
			GeoKeyDirectory.push(Value_Offset);
		});
		metadata.GeoKeyDirectory = GeoKeyDirectory;
	}

	// delete GeoKeys from metadata, because stored in GeoKeyDirectory tag
	for (var geoKey in geoKeys) {
		delete metadata[geoKey];
	}

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
