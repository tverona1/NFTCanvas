import all from "it-all";
import AreaMetadata from "./AreaMetadata";
import uint8ArrayConcat from "uint8arrays/concat";
import uint8ArrayToString from "uint8arrays/to-string";
import axios, { AxiosResponse } from "axios";
import { BigNumber } from "ethers";

type IPFSCache = {
    curPriceUSMicros: BigNumber;
    canvasData: TokenData[];
}

type TokenData = {
    tokenId: BigNumber;
    owner: string;
    tokenUri: string;
}

export default class IpfsUtils {

    /**
     * Craete json metadata to be persisted in IPFS
     * @param args metadata
     * @returns JSON as stsring
     */
    private static createJsonMetadata(args: { name: string, description: string, externalUrl: string, imageUrl?: string }): string {
        const metadata: AreaMetadata = {
            description: args.description,
            external_url: args.externalUrl,
            image: args.imageUrl,
            name: args.name,
        }

        return JSON.stringify(metadata);
    }

    /**
     * Loads image from IPFS
     * 
     * @param ipfsUri Image URI from IPFS
     * @returns Byte array
     */
    static async getImageFromIPFS(ipfsClient: any, ipfsUri: string): Promise<Uint8Array | null> {
        try {
            const ipfsPath = ipfsUri.replace("ipfs://", "");
            const data = uint8ArrayConcat(await all(ipfsClient.cat(ipfsPath)));
            console.log(`Loaded ${data.length} bytes at ${ipfsPath}`);
            return data;
        } catch (error) {
            console.error(`Error getting image from IPFS: ${error}`);
        }

        return null;
    }

    /**
     * Loads json metadata from IPFS
     * @param ipfsUri JSON URI from IPFS
     * @returns area metadata
     */
    static async getMetadataFromIPFS(ipfsClient: any, ipfsUri: string): Promise<AreaMetadata | null> {
        try {
            const ipfsPath = ipfsUri.replace("ipfs://", "");
            console.log("Loading metadata from path: " + ipfsPath);

            const data = uint8ArrayConcat(await all(ipfsClient.cat(ipfsPath, { length: 1024 })))

            const stringData = uint8ArrayToString(data);
            const pojo: AreaMetadata = JSON.parse(stringData);

            type AreaMetadata = {
                name: string;
                image?: string;
                description?: string;
                external_url?: string;
            }

            return { name: pojo['name'], description: pojo['description'], external_url: pojo['external_url'], image: pojo['image'] };
        } catch (error) {
            console.error(`Error getting metadata from ipfs: ${error}`);
        }

        return null;
    }

    /**
     * Load canvas data pre-cached in IPFS
     */
    static async loadCanvasDataFromIPFS(path: string | undefined, lastModified: string | undefined, updateCanvasDataCallback: (owner: string, tokenId: BigNumber, uri: string) => Promise<void>, updateCurrentPriceUSMicrosFromCache: (curPriceUSMicros: BigNumber) => void): Promise<string | undefined> {
        try {
            if (!path) {
                return undefined;
            }

            // Add timestamp to force refresh (otherwise we can cached browser data)
            const pathUnique = `${path}?timestamp=${Date.now()}`;

            // If last modified stamp is provided, check if we have modified data
            if (lastModified != null) {
                const headerResponse = await axios.head(pathUnique);
                if (headerResponse.headers['last-modified'] === lastModified) {
                    // Nothing modified, so bail
                    return lastModified;
                }
            }

            console.log(`Loading canvas data from ipfs cache at ${pathUnique}`);

            const response: AxiosResponse<IPFSCache> = await axios.get(pathUnique);
            if (response.headers['content-type'] !== 'application/json') {
                throw new Error(`Unexpected content type: ${response.headers['content-type']}`);
            }

            const lastModifiedHeader = response.headers['last-modified'];

            console.log(`Got ${response.data.canvasData.length} entries from pre-cached metadata in IPFS. Current price (US Micros): ${response.data.curPriceUSMicros} (last-modified: ${lastModifiedHeader})`);
            for (var index = 0; index < response.data.canvasData.length; index++) {
                const event = response.data.canvasData[index];
                await updateCanvasDataCallback(event.owner, BigNumber.from(event.tokenId), event.tokenUri);
            }

            updateCurrentPriceUSMicrosFromCache(BigNumber.from(response.data.curPriceUSMicros));

            console.log(`Done loading canvas data from ipfs cache`);

            return lastModifiedHeader;
        } catch (error) {
            console.error(`Error loading metadata from IPFS cache: ${error}`);
        }

        return undefined;
    }

    /**
     * Upload metadata to IPFS including image & json file
     * @returns ipfs cid
     */
    static async uploadMetadataToIPFS(ipfsClient: any, name: string, description: string, uri: string, resizedImageURL?: string, imageIpfsUrl?: string): Promise<string> {
        try {
            var imageIpfsFile = imageIpfsUrl;

            // Upload image
            if (null != resizedImageURL) {
                console.log(`Uploading image to IPFS from url ${resizedImageURL}`);
                const blob = await (await fetch(resizedImageURL)).blob();
                const imageIpfsFileCid = await ipfsClient.add(blob);
                imageIpfsFile = "ipfs://" + imageIpfsFileCid.cid.toString();
                console.log(`Uploaded image to IPFS at path: ${imageIpfsFile}`);
            } else {
                console.log(`Using image ipfs url: ${imageIpfsFile}`);
            }

            // Upload JSON metadata
            console.log(`Uploading JSON metadata to IPFS`);
            const jsonMetadata = this.createJsonMetadata({ name: name, description: description, externalUrl: uri, imageUrl: imageIpfsFile });
            const jsonIpfsFileCid = await ipfsClient.add(jsonMetadata);
            const jsonIPFSFile = "ipfs://" + jsonIpfsFileCid.cid.toString();
            console.log(`Uploaded json metadata to IPFS at path: ${jsonIPFSFile}`);
            return jsonIPFSFile;
        } catch (error) {
            console.error(`Error uploading to IPFS: ${error}`);
            throw error;
        }
    }
}
