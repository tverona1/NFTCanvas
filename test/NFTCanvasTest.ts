// Import Chai to use its asserting functions here.
const { expect } = require("chai");

import { ethers, waffle } from "hardhat";

import { NFTCanvas__factory } from "../typechain/factories/NFTCanvas__factory";
import { NFTCanvas } from "../typechain/NFTCanvas";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe("NFTCanvas contract", function () {
    let nftCanvasFactory: NFTCanvas__factory;
    let nftCanvasToken: NFTCanvas;
    let owner: SignerWithAddress;
    let deployer: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    let priceRanges = [3, 6, 12];
    let pricePerRange = [1, 10, 100];
    let maxBlocksPerPurchasePerRange = [10000, 10000, 10000];

    const getBlockId = (x: number, y: number): number => {
        return x + (y << 16);
    }

    const getTokenId = (x1: number, y1: number, x2: number, y2: number): BigNumber => {
        return BigNumber.from(getBlockId(x1, y1)).add(BigNumber.from(getBlockId(x2, y2)).shl(32));
    }

    // `beforeEach` runs before each test, re-deploying the contract every
    // time.
    beforeEach(async function () {
        // Get the Signers here.
        [owner, deployer, addr1, addr2, ...addrs] = await ethers.getSigners();
        nftCanvasFactory = new NFTCanvas__factory(deployer);
 
        // Deploy contract
        nftCanvasToken = await nftCanvasFactory.deploy(priceRanges, pricePerRange, maxBlocksPerPurchasePerRange);
        await nftCanvasToken.deployed();
    });

    it("Should set the initial price", async function () {
        // Validate initial price
        expect(await nftCanvasToken.getCurrentPriceUSMicros()).to.equal(pricePerRange[0]);
    });

    describe("Price", function () {
        it("Area price should not be zero", async function () {
            const areaPrice1Block = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            expect(areaPrice1Block).to.be.above(0);
        });

        it("Invalid area (x1 > x2) should revert", async function () {
            await expect(nftCanvasToken.getAreaPrice(10, 0, 5, 10)
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (y1 > y2) should revert", async function () {
            await expect(nftCanvasToken.getAreaPrice(0, 50, 5, 10)
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (out of bounds) should revert", async function () {
            await expect(nftCanvasToken.getAreaPrice(0, 500, 5, 1000)
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (at end of canvas) should revert", async function () {
            await expect(nftCanvasToken.getAreaPrice(384, 216, 384, 216)
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (at end of x axis) should revert", async function () {
            await expect(nftCanvasToken.getAreaPrice(384, 0, 384, 1)
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (at end of y axis) should revert", async function () {
            await expect(nftCanvasToken.getAreaPrice(0, 216, 1, 216)
            ).to.be.revertedWith("Invalid area");
        });

        it("10 blocks should equal 10x of one block", async function () {
            const areaPrice1Block = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            const areaPrice = (await nftCanvasToken.getAreaPrice(0, 0, 10, 1));
            expect(areaPrice).to.equal(areaPrice1Block.mul(10));
        });

        it("1 block (end of canvas) should equal 10x of one block", async function () {
            const areaPrice1Block = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            const areaPrice = (await nftCanvasToken.getAreaPrice(383, 215, 384, 216));
            expect(areaPrice).to.equal(areaPrice1Block);
        });

        it("1 block (end of x axis) should equal 10x of one block", async function () {
            const areaPrice1Block = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            const areaPrice = (await nftCanvasToken.getAreaPrice(383, 0, 384, 1));
            expect(areaPrice).to.equal(areaPrice1Block);
        });

        it("1 block (end of y axis) should equal 10x of one block", async function () {
            const areaPrice1Block = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            const areaPrice = (await nftCanvasToken.getAreaPrice(0, 215, 1, 216));
            expect(areaPrice).to.equal(areaPrice1Block);
        });

        it("100 blocks should equal 100x of one block", async function () {
            const areaPrice1Block = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            const areaPrice100Blocks = (await nftCanvasToken.getAreaPrice(0, 0, 10, 10));
            expect(areaPrice100Blocks).to.equal(areaPrice1Block.mul(100));
        });

        it("Validate setting new price", async function () {
            let newPriceRanges = [15, 20, 50];
            let newPricePerRange = [1000, 10, 100];
            let maxBlocksPerPurchasePerRange = [10, 20, 50];

            await nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange);
            const price = await nftCanvasToken.getCurrentPriceUSMicros();
            expect(price).to.equal(1000);
        });

        it("Price should not be settable by non-owner", async function () {
            let newPriceRanges = [5, 10, 15];
            let newPricePerRange = [5, 50, 500];
            let maxBlocksPerPurchasePerRange = [5, 10, 15];

            await expect(nftCanvasToken.connect(addr1).setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Fail if price tier is empty", async function () {
            let newPriceRanges = [];
            let newPricePerRange = [];
            let maxBlocksPerPurchasePerRange = [];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("No price range specified");
        });

        it("Fail if price tier is not sorted", async function () {
            let newPriceRanges = [1000, 400, 10];
            let newPricePerRange = [1, 10, 100];
            let maxBlocksPerPurchasePerRange = [1000, 400, 10];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Price range not sorted");
        });

        it("Fail if price tier length does match price per tier length", async function () {
            let newPriceRanges = [5, 10, 15, 20];
            let newPricePerRange = [1, 10, 100];
            let maxBlocksPerPurchasePerRange = [5, 10, 15, 20];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Price range length does not match price length");

            newPriceRanges = [5, 10, 15];
            newPricePerRange = [1, 10, 100, 1000];
            maxBlocksPerPurchasePerRange = [5, 10, 15];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Price range length does not match price length");

            newPriceRanges = [5, 10, 15, 20];
            newPricePerRange = [1, 10, 100, 1000];
            maxBlocksPerPurchasePerRange = [5, 10, 15];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Max blocks per purchase per range length does not match price length");

            newPriceRanges = [5, 10, 15];
            newPricePerRange = [1, 10, 100];
            maxBlocksPerPurchasePerRange = [5, 10, 15, 20];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Max blocks per purchase per range length does not match price length");
        });
    });

    describe("Purchase", function () {
        let blockPrice: BigNumber;
        before(async function() {
            blockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
        });

        it("Purchase a block should fail without enough funds", async function () {
            await expect(nftCanvasToken.purchaseArea(0, 0, 1, 1, "")
            ).to.be.revertedWith("Price is too low");
        });

        it("Purchase 2 blocks should fail without enough funds", async function () {
            await expect(nftCanvasToken.connect(addr1).purchaseArea(0, 0, 2, 1, "", { value: blockPrice } )
            ).to.be.revertedWith("Price is too low");
        });

        it("Invalid area (x1 > x2) should revert", async function () {
            await expect(nftCanvasToken.purchaseArea(10, 0, 5, 10, "", { value: blockPrice } )
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (y1 > y2) should revert", async function () {
            await expect(nftCanvasToken.connect(addr1).purchaseArea(0, 50, 5, 10, "", { value: blockPrice } )
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (out of bounds) should revert", async function () {
            await expect(nftCanvasToken.purchaseArea(0, 500, 5, 1000, "", { value: blockPrice} )
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (out of bounds 2) should revert", async function () {
            await expect(nftCanvasToken.purchaseArea(380, 200, 385, 201, "", { value: blockPrice} )
            ).to.be.revertedWith("Invalid area");
        });

        it("Invalid area (out of bounds 3) should revert", async function () {
            await expect(nftCanvasToken.purchaseArea(380, 200, 381, 217, "", { value: blockPrice} )
            ).to.be.revertedWith("Invalid area");
        });

        it("Purchase an owned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(nftCanvasToken.connect(addr2).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.be.revertedWith("Area already owned");
        });

        it("Purchase an overlapping owned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 3, 3, "http://testuri", { value: blockPrice.mul(9) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 3, 3, getTokenId(0, 0, 3, 3), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9));

            // Get new block price for the tier
            let blockPrice2 = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            expect(blockPrice2 > blockPrice).to.equals(true);

            await expect(nftCanvasToken.connect(addr2).purchaseArea(0, 0, 4, 2, "http://testuri", { value: blockPrice2.mul(8) })
            ).to.be.revertedWith("Area already owned");
        });

        it("Purchase an overlapping owned area (same address) should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 3, 3, "http://testuri", { value: blockPrice.mul(9) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 3, 3, getTokenId(0, 0, 3, 3), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9));

            // Get new block price for the tier
            let blockPrice2 = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            expect(blockPrice2 > blockPrice).to.equals(true);

            await expect(nftCanvasToken.connect(addr1).purchaseArea(0, 0, 4, 2, "http://testuri", { value: blockPrice2.mul(8) })
            ).to.be.revertedWith("Area already owned");
        });

        it("Purchase an overlapping (subset) owned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 10, 10, "http://testuri", { value: blockPrice.mul(100) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 10, 10, getTokenId(0, 0, 10, 10), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(100));

            // Get new block price for the tier
            let blockPrice2 = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            expect(blockPrice2 > blockPrice).to.equals(true);

            await expect(nftCanvasToken.connect(addr2).purchaseArea(2, 2, 4, 4, "http://testuri", { value: blockPrice2.mul(8) })
            ).to.be.revertedWith("Area already owned");
        });

        it("Purchase an overlapping (superset) owned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 4, 4, "http://testuri", { value: blockPrice.mul(8) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 4, 4, getTokenId(2, 2, 4, 4), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(8));

            // Get new block price for the tier
            let blockPrice2 = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            expect(blockPrice2 > blockPrice).to.equals(true);

            await expect(nftCanvasToken.connect(addr2).purchaseArea(0, 0, 10, 10, "http://testuri", { value: blockPrice2.mul(100) })
            ).to.be.revertedWith("Area already owned");
        });

        it("Purchase a block should succeed", async function () {
            const tokenId = getTokenId(0, 0, 1, 1);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, tokenId, "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(1);
            expect(await nftCanvasToken.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(tokenId)).to.equal("http://testuri");
            expect(await nftCanvasToken.totalSupply()).to.equal(1);
        });

        it("Purchase 9 blocks should succeed", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 3, 3, "http://testuri", { value: blockPrice.mul(9) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 3, 3, getTokenId(0, 0, 3, 3), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9));
        });

        it("Purchase 25 blocks should succeed", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 5, 5, "http://testuri", { value: blockPrice.mul(25) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 5, 5, getTokenId(0, 0, 5, 5), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(25));
        });

        it("Purchase 100 horizontal blocks should succeed", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(200, 200, 300, 201, "http://testuri", { value: blockPrice.mul(100) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 200, 200, 300, 201, getTokenId(200, 200, 300, 201), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(100));
        });

        it("Purchase 100 vertical blocks should succeed", async function () {
            const tokenId = getTokenId(250, 100, 251, 200);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(250, 100, 251, 200, "http://testuri", { value: blockPrice.mul(100) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 250, 100, 251, 200, tokenId, "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(100));

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(1);
            expect(await nftCanvasToken.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(tokenId)).to.equal("http://testuri");
            expect(await nftCanvasToken.totalSupply()).to.equal(1);
        });

        it("Purchase block at canvas edge should succeed", async function () {
            const tokenId = getTokenId(380, 210, 384, 216);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(380, 210, 384, 216, "http://testuri", { value: blockPrice.mul(100) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 380, 210, 384, 216, tokenId, "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(100));

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(1);
            expect(await nftCanvasToken.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(tokenId)).to.equal("http://testuri");
            expect(await nftCanvasToken.totalSupply()).to.equal(1);
        });

        it("Purchase block at canvas edge 2 should succeed", async function () {
            const tokenId = getTokenId(376, 209, 384, 216);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(376, 209, 384, 216, "http://testuri", { value: blockPrice.mul(56) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 376, 209, 384, 216, tokenId, "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(56));

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(1);
            expect(await nftCanvasToken.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(tokenId)).to.equal("http://testuri");
            expect(await nftCanvasToken.totalSupply()).to.equal(1);
        });

        it("Purchase multiple areas should add to balance", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 3, 3, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 3, 3, getTokenId(2, 2, 3, 3), "http://testuri");

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 4, 2, "http://testuri2", { value: blockPrice.mul(8) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(1, addr1.address, 0, 0, 4, 2, getTokenId(0, 0, 4, 2), "http://testuri2");

            contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9));

            // Get new block price for the tier
            let blockPrice2 = (await nftCanvasToken.getAreaPrice(0, 0, 1, 1));
            expect(blockPrice2 > blockPrice).to.equals(true);

            await expect(await nftCanvasToken.connect(addr2).purchaseArea(10, 10, 15, 15, "http://testuri3", { value: blockPrice2.mul(25) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(2, addr2.address, 10, 10, 15, 15, getTokenId(10, 10, 15, 15), "http://testuri3");

            contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9).add(blockPrice2.mul(25)));

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(2);
            expect(await nftCanvasToken.balanceOf(addr2.address)).to.equal(1);

            expect(await nftCanvasToken.ownerOf(getTokenId(2, 2, 3, 3))).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(getTokenId(2, 2, 3, 3))).to.equal("http://testuri");
            expect(await nftCanvasToken.ownerOf(getTokenId(0, 0, 4, 2))).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(getTokenId(0, 0, 4, 2))).to.equal("http://testuri2");
            expect(await nftCanvasToken.ownerOf(getTokenId(10, 10, 15, 15))).to.equal(addr2.address);
            expect(await nftCanvasToken.tokenURI(getTokenId(10, 10, 15, 15))).to.equal("http://testuri3");
            expect(await nftCanvasToken.tokenOfOwnerByIndex(addr1.address, 0)).to.equal(getTokenId(2, 2, 3, 3));
            expect(await nftCanvasToken.tokenOfOwnerByIndex(addr1.address, 1)).to.equal(getTokenId(0, 0, 4, 2));
            expect(await nftCanvasToken.tokenOfOwnerByIndex(addr2.address, 0)).to.equal(getTokenId(10, 10, 15, 15));
            expect(await nftCanvasToken.tokenByIndex(0)).to.equal(getTokenId(2, 2, 3, 3));
            expect(await nftCanvasToken.tokenByIndex(1)).to.equal(getTokenId(0, 0, 4, 2));
            expect(await nftCanvasToken.tokenByIndex(2)).to.equal(getTokenId(10, 10, 15, 15));

            expect(await nftCanvasToken.totalSupply()).to.equal(3);
        });

        it("Purchase adjacent owned area should succeed", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 3, 3, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 3, 3, getTokenId(2, 2, 3, 3), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(await nftCanvasToken.connect(addr2).purchaseArea(0, 0, 4, 2, "http://testuri2", { value: blockPrice.mul(8) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(1, addr2.address, 0, 0, 4, 2, getTokenId(0, 0, 4, 2), "http://testuri2");

            const contractBalance2 = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance2).to.equal(blockPrice.mul(9));
        });

        it("Validate price tiers", async function () {
            let pos = 0;
            let curBlockPrice = blockPrice;
            for (var i = 0; i < priceRanges.length; i++) {
                for (var j = pos; j < priceRanges[i]; j++) {
                    curBlockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
                    const curPriceUSMicros = await nftCanvasToken.getCurrentPriceUSMicros();
                    expect(curPriceUSMicros).to.equal(pricePerRange[i]);
                    const tokenId = getTokenId(pos, pos, pos+1, pos+1);
                    await expect(await nftCanvasToken.connect(addr1).purchaseArea(pos, pos, pos+1, pos+1, "http://testuri", { value: curBlockPrice})
                    ).to.emit(nftCanvasToken, "MetadataEvent")
                    .withArgs(pos, addr1.address, pos, pos, pos+1, pos+1, tokenId, "http://testuri");
                    pos++;
                }
            }

            // Validate price at max tier
            const tokenId = getTokenId(pos, pos, pos+1, pos+1);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(pos, pos, pos+1, pos+1, "http://testuri", { value: curBlockPrice})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(pos, addr1.address, pos, pos, pos+1, pos+1, tokenId, "http://testuri");
            expect(await nftCanvasToken.getCurrentPriceUSMicros()).to.equal(pricePerRange[pricePerRange.length-1]);
        });
    });

    describe("Max blocks", function () {
        let blockPrice: BigNumber;
        before(async function() {
            blockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
        });

        it("Max block per purchase should not be zero", async function () {
            let newPriceRanges = [15, 20, 50];
            let newPricePerRange = [0, 10, 100];
            let maxBlocksPerPurchasePerRange = [10, 20, 0];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Max blocks for range is not positive");

            newPriceRanges = [15, 20, 50];
            newPricePerRange = [10, 0, 100];
            maxBlocksPerPurchasePerRange = [0, 20, 30];

            await expect(nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange)
            ).to.be.revertedWith("Max blocks for range is not positive");
        });

        it("Fail if trying to buy more than max blocks per purchase", async function () {
            let newPriceRanges = [10, 20, 30];
            let newPricePerRange = [10, 10, 10];
            let maxBlocksPerPurchasePerRange = [10, 5, 40];
            await nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange);

            let newblockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);

            // Exceeding max block size should fail at tier 1
            await expect(nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 11, "http://testuri", { value: newblockPrice.mul(11)})
            ).to.be.revertedWith("Exceeding max number of blocks per purchase");

            // Buy max block size at tier 1
            let tokenId = getTokenId(0, 0, 1, 10);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 10, "http://testuri", { value: newblockPrice.mul(10)})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 10, tokenId, "http://testuri");

            // Exceeding max block size should fail at tier 2
            await expect(nftCanvasToken.connect(addr1).purchaseArea(0, 10, 6, 11, "http://testuri", { value: newblockPrice.mul(6)})
            ).to.be.revertedWith("Exceeding max number of blocks per purchase");

            // Buy max block size at tier 2
            tokenId = getTokenId(0, 10, 5, 11);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 10, 5, 11, "http://testuri", { value: newblockPrice.mul(5)})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(1, addr1.address, 0, 10, 5, 11, tokenId, "http://testuri");

            // Buy max block size at tier 2
            tokenId = getTokenId(20, 20, 25, 21);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(20, 20, 25, 21, "http://testuri", { value: newblockPrice.mul(5)})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(2, addr1.address, 20, 20, 25, 21, tokenId, "http://testuri");

            // Exceeding max block size should fail at tier 3
            await expect(nftCanvasToken.connect(addr1).purchaseArea(80, 80, 84, 91, "http://testuri", { value: newblockPrice.mul(44)})
            ).to.be.revertedWith("Exceeding max number of blocks per purchase");

            // Buy max block size at tier 3
            tokenId = getTokenId(80, 80, 84, 90);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(80, 80, 84, 90, "http://testuri", { value: newblockPrice.mul(40)})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(3, addr1.address, 80, 80, 84, 90, tokenId, "http://testuri");
        });
    });

    describe("Transfer", function () {
        let blockPrice: BigNumber;
        before(async function() {
            blockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
        });

        it("Transfer by non-owner should fail", async function () {
            const tokenId = getTokenId(0, 0, 1, 1);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, tokenId, "http://testuri");

            await expect(nftCanvasToken.connect(addr2).transferFrom(addr1.address, addr2.address, tokenId)
            ).to.be.revertedWith("transfer caller is not owner nor approved");
        });

        it("Transfer by owner should succeed", async function () {
            const tokenId = getTokenId(0, 0, 1, 1);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice})
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, tokenId, "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(1);
            expect(await nftCanvasToken.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftCanvasToken.tokenURI(tokenId)).to.equal("http://testuri");
            expect(await nftCanvasToken.totalSupply()).to.equal(1);

            await nftCanvasToken.connect(addr1)["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, tokenId)

            expect(await nftCanvasToken.balanceOf(addr1.address)).to.equal(0);
            expect(await nftCanvasToken.balanceOf(addr2.address)).to.equal(1);
            expect(await nftCanvasToken.ownerOf(tokenId)).to.equal(addr2.address);
            expect(await nftCanvasToken.totalSupply()).to.equal(1);
        });

        it("Transfer ownership by non owner should fail", async function () {
            await expect(nftCanvasToken.connect(addr1).transferOwnership(addr2.address)
            ).to.be.revertedWith("caller is not the owner");
        });
    });
    
    describe("SetMetadata", function () {
        let blockPrice: BigNumber;
        before(async function() {
            blockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
        });

        it("Set metadata on invalid area (x1 > x2) should revert", async function () {
            await expect(nftCanvasToken.setMetadataOnArea(10, 0, 5, 10, "")
            ).to.be.revertedWith("Invalid area");
        });

        it("Set metadata on invalid area (y1 > y2) should revert", async function () {
            await expect(nftCanvasToken.connect(addr1).setMetadataOnArea(0, 50, 5, 10, "")
            ).to.be.revertedWith("Invalid area");
        });

        it("Set metadata on invalid area (out of bounds) should revert", async function () {
            await expect(nftCanvasToken.setMetadataOnArea(0, 500, 5, 1000, "")
            ).to.be.revertedWith("Invalid area");
        });

        it("Set metadata an unminted area should fail", async function () {
            await expect(nftCanvasToken.setMetadataOnArea(0, 0, 1, 1, "")
            ).to.be.revertedWith("operator query for nonexistent token");
        });

        it("Set metadata an unowned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(nftCanvasToken.connect(addr2).setMetadataOnArea(0, 0, 1, 1, "http://testuri2")
            ).to.be.revertedWith("Not owner or approver");
        });

        it("Set metadata on unowned overlapping area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 3, 3, "http://testuri", { value: blockPrice.mul(9) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 3, 3, getTokenId(0, 0, 3, 3), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9));

            await expect(nftCanvasToken.connect(addr2).setMetadataOnArea(0, 0, 4, 2, "http://testuri2")
            ).to.be.revertedWith("operator query for nonexistent token");
        });

        it("Set metadata on overlapping (subset) owned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 10, 10, "http://testuri", { value: blockPrice.mul(100) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 10, 10, getTokenId(0, 0, 10, 10), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(100));

            await expect(nftCanvasToken.connect(addr1).setMetadataOnArea(0, 0, 4, 2, "http://testuri2")
            ).to.be.revertedWith("operator query for nonexistent token");
        });

        it("Set metadata onoverlapping (superset) owned area should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 4, 4, "http://testuri", { value: blockPrice.mul(8) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 4, 4, getTokenId(2, 2, 4, 4), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(8));

            await expect(nftCanvasToken.connect(addr1).setMetadataOnArea(0, 0, 4, 2, "http://testuri2")
            ).to.be.revertedWith("operator query for nonexistent token");
        });

        it("Set metadata on owned area should succeed", async function () {
            const tokenId = getTokenId(0, 0, 3, 3);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 3, 3, "http://testuri", { value: blockPrice.mul(9) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 3, 3, tokenId, "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(9));

            await expect(await nftCanvasToken.connect(addr1).setMetadataOnArea(0, 0, 3, 3, "http://testuri2")
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(1, addr1.address, 0, 0, 3, 3, tokenId, "http://testuri2");

            await expect(await nftCanvasToken.connect(addr1).tokenURI(tokenId)
            ).to.equal("http://testuri2");
        });

        it("Set metadata multiple times should succeed", async function () {
            const tokenId = getTokenId(2, 2, 40, 40);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 40, 40, "http://testuri", { value: blockPrice.mul(1444) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 40, 40, tokenId, "http://testuri");

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(1444));

            await expect(await nftCanvasToken.connect(addr1).setMetadataOnArea(2, 2, 40, 40, "http://testuri2")
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(1, addr1.address, 2, 2, 40, 40, tokenId, "http://testuri2");

            await expect(await nftCanvasToken.connect(addr1).tokenURI(tokenId)
            ).to.equal("http://testuri2");

            await expect(await nftCanvasToken.connect(addr1).setMetadataOnArea(2, 2, 40, 40, "http://testuri3")
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(2, addr1.address, 2, 2, 40, 40, tokenId, "http://testuri3");

            await expect(await nftCanvasToken.connect(addr1).tokenURI(tokenId)
            ).to.equal("http://testuri3");
        });
    });

    describe("SendTo", function () {
        let blockPrice: BigNumber;
        beforeEach(async function() {
            blockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
        });

        it("Send 0 amount should fail", async function () {
            await expect(nftCanvasToken.sendTo(deployer.address, 0)
            ).to.be.revertedWith("Amount out of range");
        });

        it("Send to contract address should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(nftCanvasToken.connect(deployer).sendTo(nftCanvasToken.address, blockPrice)
            ).to.be.revertedWith("Invalid payee");
        });

        it("Send too high amount should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(nftCanvasToken.sendTo(deployer.address, blockPrice.mul(2))
            ).to.be.revertedWith("Amount out of range");
        });

        it("Send by non-owner should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(nftCanvasToken.connect(addr1).sendTo(addr1.address, blockPrice)
            ).to.be.revertedWith("caller is not the owner");
        });

        it("Send by contract address should fail", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await expect(nftCanvasToken.connect(nftCanvasToken.address).sendTo(addr1.address, blockPrice)
            ).to.be.revertedWith("caller is not the owner");
        });

        it("Send by owner address to owner should succeed", async function () {
            let newPriceRanges = [10, 20, 50];
            let newPricePerRange = [10000000, 10, 100];
            let maxBlocksPerPurchasePerRange = [10, 20, 50];
            await nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange);

            let blockPrice2 = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);

            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice2 })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const initDeployerBalance = await waffle.provider.getBalance(deployer.address);

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice2);

            await nftCanvasToken.connect(deployer).sendTo(deployer.address, blockPrice2);

            contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(0);

            const deployerBalance = await waffle.provider.getBalance(deployer.address);
            expect(deployerBalance).above(initDeployerBalance);
        });

        it("Send by owner address to another address should succeed", async function () {
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 1, 1, "http://testuri", { value: blockPrice })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 1, 1, getTokenId(0, 0, 1, 1), "http://testuri");

            const initBalance = await waffle.provider.getBalance(addr1.address);

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice);

            await nftCanvasToken.connect(deployer).sendTo(addr1.address, blockPrice);

            contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(0);

            const balance = await waffle.provider.getBalance(addr1.address);
            expect(balance).to.equal(initBalance.add(blockPrice));
        });

        it("Send large amount by owner address to owner should succeed", async function () {
            let newPriceRanges = [100000];
            let newPricePerRange = [10000];
            let maxBlocksPerPurchasePerRange = [100000];
            await nftCanvasToken.setPriceRanges(newPriceRanges, newPricePerRange, maxBlocksPerPurchasePerRange);

            let blockPrice2 = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);

            await expect(await nftCanvasToken.connect(addr1).purchaseArea(0, 0, 100, 100, "http://testuri", { value: blockPrice2.mul(10000) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 0, 0, 100, 100, getTokenId(0, 0, 100, 100), "http://testuri");

            const initBalance = await waffle.provider.getBalance(deployer.address);

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice2.mul(10000));

            await nftCanvasToken.connect(deployer).sendTo(deployer.address, blockPrice2.mul(5000));

            contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice2.mul(5000));

            const balance = await waffle.provider.getBalance(deployer.address);
            expect(balance).above(initBalance.add(blockPrice2.mul(4900)));
        });
    });

    describe("Burn", function () {
        let blockPrice: BigNumber;
        before(async function() {
            blockPrice = await nftCanvasToken.getAreaPrice(0, 0, 1, 1);
        });

        it("Burn non-owned token should fail", async function () {
            const tokenId = getTokenId(2, 2, 40, 40);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 40, 40, "http://testuri", { value: blockPrice.mul(1444) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 40, 40, tokenId, "http://testuri");

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(1444));

            await expect (nftCanvasToken.connect(addr2).burn(tokenId)
            ).to.be.revertedWith("caller is not owner nor approved");
        });

        it("Burn owned token should succeed", async function () {
            const tokenId = getTokenId(2, 2, 40, 40);
            await expect(await nftCanvasToken.connect(addr1).purchaseArea(2, 2, 40, 40, "http://testuri", { value: blockPrice.mul(1444) })
            ).to.emit(nftCanvasToken, "MetadataEvent")
            .withArgs(0, addr1.address, 2, 2, 40, 40, tokenId, "http://testuri");

            var contractBalance = await waffle.provider.getBalance(nftCanvasToken.address);
            expect(contractBalance).to.equal(blockPrice.mul(1444));

            await nftCanvasToken.connect(addr1).burn(tokenId);

            await expect(nftCanvasToken.ownerOf(tokenId)
            ).to.be.revertedWith("owner query for nonexistent token");
        });
    });

});