import GeoTIFFBase from './GeoTIFFBase';
import GeoTIFFImage from './geotiffimage';

/**
 * Wrapper for GeoTIFF files that have external overviews.
 * @augments GeoTIFFBase
 */
export default class MultiGeoTIFF extends GeoTIFFBase {
  /**
   * Construct a new MultiGeoTIFF from a main and several overview files.
   * @param {GeoTIFF} mainFile The main GeoTIFF file.
   * @param {GeoTIFF[]} overviewFiles An array of overview files.
   */
  constructor(mainFile, overviewFiles) {
    super();
    this.mainFile = mainFile;
    this.overviewFiles = overviewFiles;
    this.imageFiles = [mainFile].concat(overviewFiles);

    this.fileDirectoriesPerFile = null;
    this.fileDirectoriesPerFileParsing = null;
    this.imageCount = null;
  }

  async parseFileDirectoriesPerFile() {
    const requests = [this.mainFile.parseFileDirectories()]
      .concat(this.overviewFiles.map(file => file.parseFileDirectories()));

    this.fileDirectoriesPerFile = await Promise.all(requests);
    return this.fileDirectoriesPerFile;
  }

  /**
   * Get the n-th internal subfile of an image. By default, the first is returned.
   *
   * @param {Number} [index=0] the index of the image to return.
   * @returns {GeoTIFFImage} the image at the given index
   */
  async getImage(index = 0) {
    if (!this.fileDirectoriesPerFile) {
      if (!this.fileDirectoriesPerFileParsing) {
        this.fileDirectoriesPerFileParsing = this.parseFileDirectoriesPerFile();
      }
      this.fileDirectoriesPerFile = await this.fileDirectoriesPerFileParsing;
    }

    let relativeIndex = index;
    for (let i = 0; i < this.fileDirectoriesPerFile.length; ++i) {
      const fileDirectories = this.fileDirectoriesPerFile[i];
      if (relativeIndex < fileDirectories.length) {
        const file = this.imageFiles[i];
        return new GeoTIFFImage(
          fileDirectories[relativeIndex][0], fileDirectories[relativeIndex][1],
          file.dataView, file.littleEndian, file.cache, file.source,
        );
      }
      relativeIndex -= fileDirectories.length;
    }
    throw new RangeError('Invalid image index');
  }

  /**
   * Returns the count of the internal subfiles.
   *
   * @returns {Number} the number of internal subfile images
   */
  async getImageCount() {
    if (!this.fileDirectoriesPerFile) {
      if (!this.fileDirectoriesPerFileParsing) {
        this.fileDirectoriesPerFileParsing = this.parseFileDirectoriesPerFile();
      }
      this.fileDirectoriesPerFile = await this.fileDirectoriesPerFileParsing;
    }
    return this.fileDirectoriesPerFile.reduce((count, ifds) => count + ifds.length, 0);
  }
}
