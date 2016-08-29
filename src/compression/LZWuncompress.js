
class LZWuncompress {

  constructor (input, options) {
    this.littleEndian = false
    Object.assign(this, options)
    this.position = 0
    this.MIN_BITS = 9
    this.MAX_BITS = 12
    this.CLEAR_CODE = 256 // clear code
    this.EOI_CODE = 257 // end of information
    this._makeEntryLookup = false
    this.dictionary = []
  }

  initDictionary () {
    this.dictionary = new Array(258)
    this.entryLookup = {}
    this.byteLength = this.MIN_BITS
    for (var i=0; i <= 257; i++) { // i really feal like i <= 257, but I get strange unknown words that way.
      this.dictionary[i] = [i]
      if (this._makeEntryLookup) this.entryLookup[i] = i
    }
  }

  decompress (input) {
    this._makeEntryLookup = false // for speed
    this.initDictionary()
    this.position = 0
    this.result = []
    if (!input.buffer) input = new Uint8Array(input)
    var mydataview = new DataView(input.buffer)// this.inputToBinary(input)
    var code = this.getNext(mydataview)
    var oldCode
    while (code !== this.EOI_CODE) {
      if (code === this.CLEAR_CODE) {
        // console.log(`clear code ${Math.floor(this.position/8)} / ${input.length}`)
        this.initDictionary()
        code = this.getNext(mydataview)
        while (code === this.CLEAR_CODE) {
          code = this.getNext(mydataview)
        }
        if (code > this.CLEAR_CODE) {
          throw('corrupted code at scanline ' + code)
        }
        if (code === this.EOI_CODE) {
          break
        } else {
          let val = this.dictionary[code]
          this.appendArray(this.result, val)
          oldCode = code;
        }
      } else {
        if (this.dictionary[code] !== undefined) {
          let val = this.dictionary[code]
          this.appendArray(this.result, val)
          let newVal = this.dictionary[oldCode].concat(this.dictionary[code][0])
          this.addToDictionary(newVal)
          oldCode = code
        } else {
          let oldVal = this.dictionary[oldCode]
          if (!oldVal) {
            throw(`Bogus entry. Not in dictionary, ${oldCode} / ${this.dictionary.length}, position: ${this.position}`)
          }
          let newVal = oldVal.concat(this.dictionary[oldCode][0])
          this.appendArray(this.result, newVal)
          this.addToDictionary(newVal)
          oldCode = code
        }
      }
      // This is strange. It seems like the
      if (this.dictionary.length >= Math.pow(2, this.byteLength) - 1) {
        this.byteLength ++
      }
      code = this.getNext(mydataview)
    }
    return new Uint8Array(this.result)
  }

  appendArray (dest, source) {
    for(var i =0; i<source.length; i++) {
      dest.push(source[i])
    }
    return dest
  }

  haveBytesChanged () {
    if (this.dictionary.length > Math.pow(2, this.byteLength)) {
      this.byteLength ++
      console.log("------",this.byteLength)
      return true
    }
    return false
  }

  addToDictionary (arr) {
    this.dictionary.push(arr)
    if (this._makeEntryLookup) this.entryLookup[arr] = this.dictionary.length-1
    this.haveBytesChanged()
    return this.dictionary.length-1
  }

  getNext (dataview) {
    var byte = this.getByte(dataview, this.position, this.byteLength)
    // console.log(byte)
    this.position += this.byteLength
    return byte
  }

  //
  // This binary representation might actually be as fast as the completely illegible bit shift bs.
  //
  getByte (dataview, position, length) {
    var d = position % 8
    var a = Math.floor(position/8)
    var de = 8-d
    var ef = (position + length) - ((a+1)*8)
    var fg = 8*(a+2) - (position+length)
    var dg = (a+2)*8 - position
    fg = Math.max(0, fg)
    if (a >= dataview.byteLength) {
      console.warn('ran off the end of the buffer before finding EOI_CODE')
      return this.EOI_CODE
    }
    var chunk1 = dataview.getUint8(a,this.littleEndian) & (Math.pow(2, 8-d) - 1)
    chunk1 = chunk1 << (length - de)
    var chunks = chunk1
    if (a+1 < dataview.byteLength) {
      var chunk2 = dataview.getUint8(a+1,this.littleEndian) >>> fg
      chunk2 = chunk2 << Math.max(0, (length - dg))
      chunks += chunk2
    }
    if (ef > 8) {
      var hi = (a+3)*8 - (position+length)
      var chunk3 = dataview.getUint8(a+2,this.littleEndian) >>> hi
      chunks += chunk3
    }
    return chunks
  }

  // compress has not been optimized and uses a uint8 array to hold binary values.
  compress (input) {
    this._makeEntryLookup = true
    this.initDictionary()
    this.position = 0
    var resultBits = []
    var omega = []
    resultBits = this.appendArray(resultBits, this.binaryFromByte(this.CLEAR_CODE, this.byteLength))// resultBits.concat(Array.from(this.binaryFromByte(this.CLEAR_CODE, this.byteLength)))
    for (var i=0; i<input.length; i++) {
      var k = [input[i]]
      var omk = omega.concat(k)
      if (this.entryLookup[omk] !== undefined) {
        omega = omk
      } else {
        let code = this.entryLookup[omega]
        let bin = this.binaryFromByte(code, this.byteLength)
        resultBits = this.appendArray(resultBits, bin)// resultBits.concat(Array.from(bin))
        // console.log(code)
        this.addToDictionary(omk)
        omega = k
        if (this.dictionary.length >= Math.pow(2, this.MAX_BITS) ) {
          //resultBits = resultBits.concat(Array.from(this.binaryFromByte(this.CLEAR_CODE, this.byteLength)))
          resultBits = this.appendArray(resultBits, this.binaryFromByte(this.CLEAR_CODE, this.byteLength))
          this.initDictionary()
        }
      }
    }
    let code = this.entryLookup[omega]
    let bin = this.binaryFromByte(code, this.byteLength)
    resultBits = this.appendArray(resultBits, bin) // resultBits.concat(Array.from(bin))
    resultBits = resultBits = this.appendArray(resultBits, this.binaryFromByte(this.EOI_CODE, this.byteLength))// resultBits.concat(Array.from(this.binaryFromByte(this.EOI_CODE, this.byteLength)))
    this.binary = resultBits
    this.result = this.binaryToUint8(resultBits)
    return this.result
  }

  byteFromCode (code) {
    var res = this.dictionary[code]
    return res
  }

  binaryFromByte (byte, byteLength=8) {
    var res = new Uint8Array(byteLength)
    for (var i=0; i<res.length; i++) {
      var mask = Math.pow(2,i)
      var isOne = (byte & mask) > 0
      res[res.length - 1 - i] = isOne
    }
    return res
  }

  binaryToNumber (bin) {
    var res = 0
    for (var i=0; i<bin.length; i++) {
      res += Math.pow(2, bin.length - i - 1) * bin[i]
    }
    return res
  }

  inputToBinary (input, inputByteLength=8) {
    var res = new Uint8Array(input.length * inputByteLength)
    for (var i=0; i<input.length; i++) {
      var bin = this.binaryFromByte(input[i], inputByteLength)
      res.set(bin, i * inputByteLength)
    }
    return res
  }

  binaryToUint8 (bin) {
    var result = new Uint8Array(Math.ceil(bin.length/8))
    var index = 0
    for (var i=0; i<bin.length; i+=8) {
      var val = 0
      for (var j=0; j<8 && i+j<bin.length; j++) {
        val = val + bin[i+j] * Math.pow(2, 8-j-1)
      }
      result[index] = val
      index ++
    }
    return result
  }
}

// until export is avaliable
window.LZWuncompress = LZWuncompress
