//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

contract NFTCanvas is ERC721Burnable, Ownable, Pausable {
    using SafeMath for uint256;

    // Emitted when metadata is set
    event MetadataEvent(uint256 indexed index, address indexed owner, uint256 x1, uint256 y1, uint256 x2, uint256 y2, uint256 tokenId, string tokenURI);

    // Block size is 10x10 pixels
    uint256 public constant blockSize = 100;

    // Max ranges in block sizes
    uint256 public constant xRange = 384;
    uint256 public constant yRange = 216;

    // Mapping of range to per-pixel price (in US Micros - one millionth of a dollar)
    // Example:
    // Price range: [20736, 41472, 82994]
    // Price per range: [10000, 100000, 1000000]
    // The above will set price of 1 cent for minted blocks [0-20736), 10 cents for blocks [20737-41472), 100 cents for blocks [41473-82994)
    uint256[] private priceRange;
    uint256[] private priceUSMicrosPerRange;

    // Max # of blocks that can be purchased at once for given price range
    uint256[] private maxBlocksPerPurchasePerRange;

    // Current metadata event index
    uint256 private eventIndex;

    // Mapping of owned blocks
    mapping (uint256 => bool) private ownedBlocks;
    uint256 private blocksMinted;

    // Price feed oracle
    AggregatorV3Interface private priceFeed;

    /**
    * Contract constructor
    *
    * @param _priceRange price range array
    * @param _priceUSMicrosPerRange corresponding price per range (in US micros)
    */
    constructor(uint256[] memory _priceRange, uint256[] memory _priceUSMicrosPerRange, uint256[] memory _maxBlocksPerPurchase) ERC721("NFT Canvas", "nftc") {
        // Set price ranges and max blocks per purchase
        setPriceRanges(_priceRange, _priceUSMicrosPerRange, _maxBlocksPerPurchase);

        // ETH/USD
        // Dev / Mainnet: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419

        // MATIC/USD
        // Mumbai: 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
        // Polygon Mainnet: 0xAB594600376Ec9fD91F8e885dADF0CE036862dE0

        priceFeed = AggregatorV3Interface(0xAB594600376Ec9fD91F8e885dADF0CE036862dE0);
    }

    /**
    * @dev Purchase an area of pixel blocks
    *
    * @param x1, y1, x2, y2 - area coordinates
    * @param tokenURI - token URI
    */
    function purchaseArea(uint256 x1, uint256 y1, uint256 x2, uint256 y2, string memory tokenURI) external payable whenNotPaused {
        require(msg.sender != address(0) && msg.sender != address(this));
        require(_isValidRange(x1, y1, x2, y2), "Cannot purchase area: Invalid area");
        require(msg.value >= getAreaPrice(x1, y1, x2, y2), "Cannot purchase area: Price is too low");

        // Generate token id representing the area
        uint256 tokenId = _getTokenId(x1, y1, x2, y2);

        _buyArea(msg.sender, x1, y1, x2, y2, tokenId, tokenURI);

        emit MetadataEvent(eventIndex, msg.sender, x1, y1, x2, y2, tokenId, tokenURI);
        eventIndex++;
    }

    /**
    * @dev Set metadata on an owned area
    *
    * @param x1, y1, x2, y2 - area coordinates
    * @param tokenURI - token URI
    */
    function setMetadataOnArea(uint256 x1, uint256 y1, uint256 x2, uint256 y2, string memory tokenURI) external whenNotPaused {
        require(_isValidRange(x1, y1, x2, y2), "Cannot set metadata: Invalid area");
        uint256 tokenId = _getTokenId(x1, y1, x2, y2);
        _setAreaMetadata(msg.sender, tokenURI, tokenId);
        emit MetadataEvent(eventIndex, msg.sender, x1, y1, x2, y2, tokenId, tokenURI);
        eventIndex++;
    }

    /**
    * @dev Send / withdraw amount to payee
    *
    * @param payee address payee
    * @param amount uint256 amount
    */
    function sendTo(address payable payee, uint256 amount) public onlyOwner {
        require(payee != address(0) && payee != address(this), "Invalid payee");
        require(amount > 0 && amount <= address(this).balance, "Amount out of range");
        payee.transfer(amount);
    }

    /**
    * @dev Sets price ranges
    *
    * @param _priceRange price range array
    * @param _priceUSMicrosPerRange corresponding price per range (in US Micros)
    */
    function setPriceRanges(uint256[] memory _priceRange, uint256[] memory _priceUSMicrosPerRange, uint256[] memory _maxBlocksPerPurchasePerRange) public onlyOwner {
        require(_priceRange.length > 0, "No price range specified");
        require(_priceRange.length == _priceUSMicrosPerRange.length, "Price range length does not match price length");
        require(_priceRange.length == _maxBlocksPerPurchasePerRange.length, "Max blocks per purchase per range length does not match price length");
        uint lastPriceRange = 0;
        for (uint i = 0; i < _priceRange.length; i++) {
            // Verify price ranges are sorted
            require(lastPriceRange < _priceRange[i], "Price range not sorted");

            // Verify max price per range is a positive number
            require(_maxBlocksPerPurchasePerRange[i] > 0, "Max blocks for range is not positive");

            lastPriceRange = _priceRange[i];
        }

        priceRange = _priceRange;
        priceUSMicrosPerRange = _priceUSMicrosPerRange;
        maxBlocksPerPurchasePerRange = _maxBlocksPerPurchasePerRange;
    }

    /**
    * @dev Get price for a given area in native coin
    *
    * @param x1, y1, x2, y2 - area coordinates
    */
    function getAreaPrice(uint256 x1, uint256 y1, uint256 x2, uint256 y2) public view returns (uint256) {   
        // Check for valid range
        require(_isValidRange(x1, y1, x2, y2), "Invalid area");

        uint256 numBlocksInArea = _getNumBlocksInArea(x1, y1, x2, y2);
        require(numBlocksInArea <= _getMaxBlocksPerPurchasePerRange(), "Exceeding max number of blocks per purchase");

        return _getBlockPriceInEth() * numBlocksInArea;
    }

    /** 
    * @dev Gets the price in US Micros for the current price range
    *
    */
    function getCurrentPriceUSMicros() public view returns (uint256) {
        return _getPriceUSMicrosForCurrentRange();
    }

    /** 
    * @dev Gets max blocks per purchase for the current price range
    *
    */
    function getCurrentMaxBlocksPerPurchase() public view returns (uint256) {
        return _getMaxBlocksPerPurchasePerRange();
    }

    /**
    * @dev Buy an area
    *
    * @param buyer buyer address
    * @param x1, y1, x2, y2 - area coordinates
    * @param tokenURI - token URI
    */
    function _buyArea(address buyer, uint256 x1, uint256 y1, uint256 x2, uint256 y2, uint256 tokenId, string memory tokenURI) private {
        // Check that blocks comprising area are not already owned & mark them as owned
        for (uint256 x = x1; x < x2; x++) {
            for (uint256 y = y1; y < y2; y++) {
                uint256 blockId = _getBlockId(x, y);
                require(!ownedBlocks[blockId], "Cannot buy area: Area already owned");
                ownedBlocks[blockId] = true;
                blocksMinted++;
            }
        }

        // Mint the token
        _mint(buyer, tokenId);

        // Set metadata on area
        _setAreaMetadata(buyer, tokenURI, tokenId);
    }

    /**
    * @dev Sets metadata on area
    *
    * @param owner owner address
    * @param tokenURI token URI
    * @param tokenId token id
    */
    function _setAreaMetadata(address owner, string memory tokenURI, uint256 tokenId) private {
        require(_isApprovedOrOwner(owner, tokenId), "Cannot set metadata: Not owner or approver");
        _setTokenURI(tokenId, tokenURI);
    }

    /**
    * @dev Computes block id given coordinates
    *
    * @param x, y - coordinates
    */
    function _getBlockId(uint256 x, uint256 y) private pure returns (uint256) {
        return x + (y << 16);
    }

    /**
    * @dev Compute token id given area
    *
    * @param x1, y1, x2, y2 - area coordinates
    */
    function _getTokenId(uint256 x1, uint256 y1, uint256 x2, uint256 y2) private pure returns (uint256) {
        return _getBlockId(x1, y1) + (_getBlockId(x2, y2) << 32);
    }

    /**
    * @dev Get price of a block (10 x 10 pixels) in eth
    *
    */
    function _getBlockPriceInEth() private view returns (uint256) {
        return _getPixelPriceInEth() * blockSize;
    }

    /**
    * @dev Gets the price in US Micros for the current price range
    *
    */
    function _getPriceUSMicrosForCurrentRange() private view returns (uint256) {
        for (uint i = 0; i < priceRange.length; i++) {
            if (blocksMinted < priceRange[i]) {
                return priceUSMicrosPerRange[i];
            }
        }

        // Return last range
        return priceUSMicrosPerRange[priceUSMicrosPerRange.length-1];
    }

    /**
    * @dev Gets the max blocks allowed per purchase for given range
    *
    */
    function _getMaxBlocksPerPurchasePerRange() private view returns (uint256) {
        for (uint i = 0; i < priceRange.length; i++) {
            if (blocksMinted < priceRange[i]) {
                return maxBlocksPerPurchasePerRange[i];
            }
        }

        // Return last range
        return maxBlocksPerPurchasePerRange[maxBlocksPerPurchasePerRange.length-1];
    }

    /**
    * @dev Get price of a pixel in eth
    *
    */
    function _getPixelPriceInEth() private view returns (uint256) {
        (, int price,,,) = priceFeed.latestRoundData();
        uint256 oneEth = 1 ether;
        uint256 decimals = priceFeed.decimals();
        require(decimals > 6, "Unexpected number of decimals in price");
        uint256 ethPerMicro = oneEth.div(uint256(price).div(10 ** (decimals - 6)));
        require(price > 0 && ethPerMicro > 0, "Invalid price");
        uint256 currentPriceUSMicros = _getPriceUSMicrosForCurrentRange();
        return ethPerMicro.mul(currentPriceUSMicros);
    }

    /**
    * @dev Get number of blocks for given area
    *
    * @param x1, y1, x2, y2 - area coordinates
    */
    function _getNumBlocksInArea(uint256 x1, uint256 y1, uint256 x2, uint256 y2) private pure returns (uint256) {
        return (x2-x1)*(y2-y1);
    }

    /**
    * @dev Determine if given area coordinates represent a valid area
    *
    * @param x1, y1, x2, y2 - area coordinates
    */
    function _isValidRange(uint256 x1, uint256 y1, uint256 x2, uint256 y2) private pure returns(bool) {
        return (x1 < x2 && y1 < y2 && x2 <= xRange && y2 <= yRange);
    }
}
