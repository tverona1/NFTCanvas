/**
 * Contract utilities / constants
 */
export default class ContractUtils {
    // Total width x height
    static readonly GRID_WIDTH_PIXELS = 3840;
    static readonly GRID_HEIGHT_PIXELS = 2160;

    // Blocksize is 10x10 pixels
    static readonly BLOCKSIZE = 10;

    // Convert from pixel size to block size
    static convertToBlockSize(x: number) {
        return Math.round(Math.round(x * this.BLOCKSIZE) / (this.BLOCKSIZE * this.BLOCKSIZE));
    }

    // Convert from block size to pixel size
    static convertFromBlockSize(x: number) {
        return x * this.BLOCKSIZE;
    }
}
