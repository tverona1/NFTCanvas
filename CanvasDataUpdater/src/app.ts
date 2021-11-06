import dotenv from 'dotenv';
import { ethers } from "ethers";

// Dev contract
import { default as contractAddressDev } from "./contracts-generated/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryDev } from "./contracts-generated/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasDev } from "./contracts-generated/typechain/NFTCanvas";

// Rinkeby test network contract
//import { default as contractAddressRinkeby } from "./contracts-generated-rinkeby/contract-address.json";
//import { NFTCanvas__factory as NFTCanvas__factoryRinkeby } from "./contracts-generated-rinkeby/typechain/factories/NFTCanvas__factory";
//import { NFTCanvas as NFTCanvasRinkeby } from "./contracts-generated-rinkeby/typechain/NFTCanvas";

// Mainnet contract
//import { default as contractAddressMainnet } from "./contracts-generated-mainnet/contract-address.json";
//import { NFTCanvas__factory as NFTCanvas__factoryMainnet } from "./contracts-generated-mainnet/typechain/factories/NFTCanvas__factory";
//import { NFTCanvas as NFTCanvasMainnet } from "./contracts-generated-mainnet/typechain/NFTCanvas";

// Mumbai contract
//import { default as contractAddressMumbai } from "./contracts-generated-mumbai/contract-address.json";
//import { NFTCanvas__factory as NFTCanvas__factoryMumbai } from "./contracts-generated-mumbai/typechain/factories/NFTCanvas__factory";
//import { NFTCanvas as NFTCanvasMumbai } from "./contracts-generated-mumbai/typechain/NFTCanvas";

// Polygon contract
import { default as contractAddressPolygon } from "./contracts-generated-polygon/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryPolygon } from "./contracts-generated-polygon/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasPolygon } from "./contracts-generated-polygon/typechain/NFTCanvas";

import ipfsClientFactory from "ipfs-http-client";

import axios, { AxiosResponse } from "axios";
import all from "it-all";
import uint8ArrayConcat from "uint8arrays/concat";
import uint8ArrayToString from "uint8arrays/to-string";

import pinataSDK from "@pinata/sdk";

import { BigNumber } from 'ethers';

dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

// Token data
type TokenData = {
  tokenId: BigNumber;
  owner: string;
  tokenUri: string;
}

// Initialize Contract info depending on environment
var contractAddress = contractAddressPolygon;
var NFTCanvas__factory: typeof NFTCanvas__factoryDev | typeof NFTCanvas__factoryPolygon = NFTCanvas__factoryPolygon;
//var NFTCanvas__factory: typeof NFTCanvas__factoryDev | typeof NFTCanvas__factoryRinkeby | typeof NFTCanvas__factoryMainnet | typeof NFTCanvas__factoryMumbai | typeof NFTCanvas__factoryPolygon = NFTCanvas__factoryDev;
type NFTCanvas = NFTCanvasDev | NFTCanvasPolygon;
//type NFTCanvas = NFTCanvasDev | NFTCanvasRinkeby | NFTCanvasMainnet | NFTCanvasMumbai | NFTCanvasPolygon;

const providerUrl = process.env.PROVIDER_URL ?? undefined;

switch (process.env.NODE_ENV) {
  case "development":
    contractAddress = contractAddressDev;
    NFTCanvas__factory = NFTCanvas__factoryDev;
    break;
  case "production":
    //contractAddress = contractAddressMainnet;
    //NFTCanvas__factory = NFTCanvas__factoryMainnet;
    //break;
    throw new Error(`Uncomment above to support ${process.env.NODE_ENV}`);
  case "test":
    //contractAddress = contractAddressRinkeby;
    //NFTCanvas__factory = NFTCanvas__factoryRinkeby;
    //break;
    throw new Error(`Uncomment above to support ${process.env.NODE_ENV}`);
  case "mumbai":
    //contractAddress = contractAddressMumbai;
    //NFTCanvas__factory = NFTCanvas__factoryMumbai;
    //break;
    throw new Error(`Uncomment above to support ${process.env.NODE_ENV}`);
  case "polygon":
    contractAddress = contractAddressPolygon;
    NFTCanvas__factory = NFTCanvas__factoryPolygon;
    break;
}

/*
class RateLimitAPI {
  limitInMillis = 500;
  lastRequestMillis = Date.now();

  async limitRate() {
    const waitTime = Date.now() - this.lastRequestMillis;
    if (waitTime < this.limitInMillis) {
      await new Promise(r => setTimeout(r, waitTime));
    }

    this.lastRequestMillis = Date.now();
  }
}*/

/**
 * Class that listens to contract events and saves these as cached data to IPFS
 * 
 */
class ProcessContractEvents {
  cleanupIntervalMillis = 30 * 60 * 1000;
  canvasData: Map<string, TokenData>;
  tokenIdToImageIPFSHash: Map<string, string>;
  lastCacheCid?: string = undefined;

  provider!: ethers.providers.JsonRpcProvider;
  nftCanvas!: NFTCanvas;
  ipfsClient;
  pinata;

  constructor() {
    console.log(`Running application in ${process.env.NODE_ENV} mode`);
    console.log(`IPFS host ${process.env.IPFS_HOST}, port: ${process.env.IPFS_PORT}, protocol: ${process.env.IPFS_PROTOCOL}`);

    this.canvasData = new Map<string, TokenData>();
    this.tokenIdToImageIPFSHash = new Map<string, string>();

    // Initialize ipfs client
    this.ipfsClient = ipfsClientFactory.create({
      host: process.env.IPFS_HOST,
      port: parseInt(process.env.IPFS_PORT ?? "5001"),
      protocol: process.env.IPFS_PROTOCOL
    });

    // Initialize Pinata client
    this.pinata = pinataSDK(process.env.PINATA_IPFS_KEY, process.env.PINATA_IPFS_SECRET);
  }

  /**
   * Initialize contract & listen for contract events
   */
  async initialize() {
    // Validate Pinata authentication
    await this.pinata.testAuthentication();

    await this.intializeEthers();
    await this.listenContractMetadata();

    // Set up periodic pin cleanup timer
    this.startCleanupScheduler();
  }

  /**
   * Connect to contract
   */
  private async intializeEthers() {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    this.nftCanvas = NFTCanvas__factory.connect(
      contractAddress.Contract,
      this.provider
    );

    console.log(`Contract address: ${contractAddress.Contract}`);
  }

  private async listenContractMetadata() {
    // Get initial set of events
    await this.initializeCanvasData();

    // Listen on metadata events
    this.nftCanvas.on("MetadataEvent", (index: BigNumber, owner: string, x1: number, y1: number, x2: number, y2: number, tokenId: BigNumber, tokenUri: string) => {
      (async () => {
        try {
          const updatedData = await this.updateCanvasData(owner, tokenId, tokenUri);

          if (updatedData) {
            // Update cache
            await this.uploadCanvasDataToIpfs();

            // Pin the uri
            await this.pinByHash(tokenUri.replace("ipfs://", ""), "uri");

            // Pin  the image
            if (this.tokenIdToImageIPFSHash.has(tokenId.toString())) {
              const imageHash = this.tokenIdToImageIPFSHash.get(tokenId.toString());
              if (imageHash != null) {
                await this.pinByHash(imageHash, "image");
              }
            }
          }
        } catch (error) {
          console.error('Error on metadata event: ' + error);
        }
      })();
    });

    // Listen for transfer events
    this.nftCanvas.on("Transfer", (from: string, to: string, tokenId: BigNumber) => {
      (async () => {
        try {
          const updatedData = await this.updateCanvasDataOwner(from, to, tokenId);

          if (updatedData) {
            // Update cache
            await this.uploadCanvasDataToIpfs();

            // Pin the uri
            const existingTokenData = this.canvasData.get(tokenId.toString());
            if (existingTokenData?.tokenUri != null) {
              await this.pinByHash(existingTokenData?.tokenUri.replace("ipfs://", ""), "uri");
            }

            // Pin  the image
            if (this.tokenIdToImageIPFSHash.has(tokenId.toString())) {
              const imageHash = this.tokenIdToImageIPFSHash.get(tokenId.toString());
              if (imageHash != null) {
                await this.pinByHash(imageHash, "image");
              }
            }
          }
        } catch (error) {
          console.error('Error on transfer event: ' + error);
        }
      })();
    });
  }

  /**
   * Initialize canvas data by querying existing set of metadata events
   */
  private async initializeCanvasData() {
    const totalTokens = (await this.nftCanvas.totalSupply()).toNumber();
    for (var i = 0; i < totalTokens; i++) {
      const tokenId = await this.nftCanvas.tokenByIndex(i);
      const tokenURI = await this.nftCanvas.tokenURI(tokenId);
      const owner = await this.nftCanvas.ownerOf(tokenId);

      await this.updateCanvasData(owner, tokenId, tokenURI);
    }

    await this.uploadCanvasDataToIpfs();

    // Pin all & clean up unused pins
    await this.pinAll();
  }

  /**
   * Update owner for given token id
   */
  private async updateCanvasDataOwner(from: string, to: string, tokenId: BigNumber): Promise<boolean> {
    const existingTokenData = this.canvasData.get(tokenId.toString());
    if (existingTokenData == null) {
      console.error(`Could not find token Id ${tokenId} to update`);
      return false;
    }

    if (existingTokenData.owner.toUpperCase() === to.toUpperCase()) {
      // No op, so bail
      return false;
    }

    console.log(`Updating canvas owner data: tokenId: ${tokenId}, owner: ${to}`);
    const tokenData: TokenData = { tokenId: tokenId, owner: to, tokenUri: existingTokenData.tokenUri };
    this.canvasData.set(tokenId.toString(), tokenData);

    // Get token metadata
    const imageHash = await this.getImageHashFromIPFS(existingTokenData.tokenUri);
    if (imageHash != null) {
      this.tokenIdToImageIPFSHash.set(tokenId.toString(), imageHash.replace("ipfs://", ""));
    }

    return true;
  }

  /**
   * Update in-memory representation of token data
   */
  private async updateCanvasData(owner: string, tokenId: BigNumber, uri: string): Promise<boolean> {

    const existingTokenData = this.canvasData.get(tokenId.toString());
    if (existingTokenData != null && existingTokenData.owner.toUpperCase() === owner.toUpperCase() && existingTokenData.tokenUri === uri) {
      // No change, return
      return false;
    }

    console.log(`Updating canvas data: tokenId: ${tokenId}, owner: ${owner}, uri: ${uri}`);
    const tokenData: TokenData = { tokenId: tokenId, owner: owner, tokenUri: uri };
    this.canvasData.set(tokenId.toString(), tokenData);

    // Get token metadata
    const imageHash = await this.getImageHashFromIPFS(uri);
    if (imageHash != null) {
      this.tokenIdToImageIPFSHash.set(tokenId.toString(), imageHash.replace("ipfs://", ""));
    }

    return true;
  }

  /**
   * Loads json metadata from IPFS
   * @param ipfsUri JSON URI from IPFS
   * @returns area metadata
   */
  private async getImageHashFromIPFS(ipfsUri: string): Promise<string> {
    const ipfsPath = ipfsUri.replace("ipfs://", "");
    const data = uint8ArrayConcat(await all(this.ipfsClient.cat(ipfsPath, { length: 1024 })))
    const stringData = uint8ArrayToString(data);

    const pojo = JSON.parse(stringData);
    return pojo.image;
  }

  /**
   * Pin given IPFS hash
   * 
   * @param ipfsHash ipfs hash
   * @returns 
   */
  private async pinByHash(ipfsHash: string, type: string) {
    const name = `${process.env.NODE_ENV}_${type}`
    await this.pinata.pinByHash(ipfsHash, {
      pinataMetadata: {
        name: name
      }
    });
    console.log(`Pinned IPFS hash ${ipfsHash} type: ${name}`);
  }

  /**
   * Invoke command against CloudFlare API
   * 
   * @param command Command to invoke
   * @returns Result json response
   *
   */
  private async invokeCloudFlareCommand(command: string, type: string, data?: any) {
    var response: AxiosResponse;
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_APITOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    try {
      switch (type) {
        case 'get':
          response = await axios.get(command, config);
          break;
        case 'post':
          response = await axios.post(command, data, config);
          break;
        case 'put':
          response = await axios.put(command, data, config);
          break;
        default:
          throw new Error('Unknown command');
      }
    } catch (error) {
      var message = error.message;
      if (error?.response?.data?.errors) {
        message += `: ${JSON.stringify(error?.response?.data?.errors)}`;
      }
      throw new Error(message);
    }

    const body = response['data'];
    if (body == null) {
      throw new Error("Empty response body");
    }

    if (!body.success) {
      throw new Error(`Error calling API: ${JSON.stringify(body.errors)}`);
    }

    return body;
  }

  /**
   * Updates txt record to point to give IPFS hash
   * 
   * @param ipfsHash IPFS hash
   */
  private async updateTxtRecord(ipfsHash: string) {
    const baseCommand = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONEID}/dns_records`;
    const txtHostName = `_dnslink.${process.env.CLOUDFLARE_CACHE_HOSTNAME}.${process.env.CLOUDFLARE_DNSNAME}`;

    // Look up existing TXT record
    const getCommand = `${baseCommand}?type=TXT&name=${txtHostName}`;
    const getResponse = await this.invokeCloudFlareCommand(getCommand, 'get');
    const id = getResponse.result[0]?.id;

    // Create TXT record
    const createCommand = `${baseCommand}${id ? '/' + id : ''}`;
    const data = {
      type: 'TXT',
      name: txtHostName,
      content: `dnslink=/ipfs/${ipfsHash}`,
      ttl: 1
    }

    await this.invokeCloudFlareCommand(createCommand, id ? 'put' : 'post', data);
  }

  /**
   * Upload canvas metadata to IPFS
   */
  private async uploadCanvasDataToIpfs() {
    try {
      const curPriceUSMicros = await this.nftCanvas.getCurrentPriceUSMicros();

      // Create json representation of data
      const jsonData = JSON.stringify({
        'curPriceUSMicros': curPriceUSMicros,
        'canvasData': Array.from(this.canvasData.values())
      });

      // Upload to IPFS
      const cidEntry = await this.ipfsClient.add(jsonData);
      const cidString = cidEntry.cid.toString();
      console.log(`Uploaded ${this.canvasData.size} metadata entries to IPFS: ${cidString}`);

      // Update txt record
      await this.updateTxtRecord(cidString);
      console.log(`Updated txt record`);

      // Pin with pinning service
      await this.pinByHash(cidString, "cache");
      this.lastCacheCid = cidString;
    } catch (error) {
      console.error(`Error encountered while updating canvas cache: ${error.message}`);
    }
  }

  /**
   * Pin all canvas data
   */
  private async pinAll() {
    // Pin all token uri's
    for (var [, tokenData] of this.canvasData) {
      await this.pinByHash(tokenData.tokenUri.replace("ipfs://", ""), "uri");
    }

    // Pin all images
    for (var [, imageHash] of this.tokenIdToImageIPFSHash) {
      await this.pinByHash(imageHash, "image");
    }
    console.log("Pinned all");
  }

  private startCleanupScheduler() {
    (async () => {
      while (true) {
        await this.cleanupUnusedPins();

        // Throttle
        await new Promise(r => setTimeout(r, this.cleanupIntervalMillis));
      }
    })();
  }

  /**
   * Unpin unused pins by type
   * @param type pin type
   * @returns 
   */
  private async cleanupUnusedPinsByType(validPins: Set<string>, type: string) {
    try {
      console.log(`Cleaning up unused pins by type: ${type}`);

      // Get pinned list
      const name = `${process.env.NODE_ENV}_${type}`
      const pinList = await this.pinata.pinList({
        metadata: {
          name: name
        }
      })

      if (pinList == null || pinList.rows == null || pinList.rows.length === 0) {
        return;
      }

      // Unpin unused entries
      for (var i = 0; i < pinList.rows.length; i++) {
        const entry = pinList.rows[i];
        if (entry.ipfs_pin_hash != null && !validPins.has(entry.ipfs_pin_hash)) {
          try {
            await this.pinata.unpin(entry.ipfs_pin_hash);
            console.log(`Unpinned unused IPFS hash ${entry.ipfs_pin_hash} type: ${name}`);
          } catch (error) {
            console.log(`Error cleaning up unused pin by type ${type} and hash: ${entry.ipfs_pin_hash}: ${JSON.stringify(error)}`);
          }
        }
      }

      console.log(`Done cleaning`);
    } catch (error) {
      console.log(`Error cleaning up unused pins by type ${type}: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Unpin all unused pins
   */
  private async cleanupUnusedPins() {
    try {
      // Clean up image pins
      const validImagePins: Set<string> = new Set<string>();
      for (var [, imageHash] of this.tokenIdToImageIPFSHash) {
        validImagePins.add(imageHash);
      }

      await this.cleanupUnusedPinsByType(validImagePins, "image");

      // Throttle
      await new Promise(r => setTimeout(r, this.cleanupIntervalMillis));

      // Clean up uri pins
      const validUriPins: Set<string> = new Set<string>();
      for (var [, tokenData] of this.canvasData) {
        validUriPins.add(tokenData.tokenUri.replace("ipfs://", ""));
      }

      await this.cleanupUnusedPinsByType(validUriPins, "uri");

      // Throttle
      await new Promise(r => setTimeout(r, this.cleanupIntervalMillis));

      // Clean up cache pins
      if (null != this.lastCacheCid) {
        await this.cleanupUnusedPinsByType(new Set<string>().add(this.lastCacheCid), "cache");
      }
    } catch (error) {
      console.log(`Error cleaning up unused pins: ${JSON.stringify(error)}`);
    }
  }
}

async function main() {
  const eventProcessor: ProcessContractEvents = new ProcessContractEvents();
  await eventProcessor.initialize();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
