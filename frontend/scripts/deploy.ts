import dotenv from 'dotenv';
import pinataSDK from '@pinata/sdk';
import axios, { AxiosResponse } from 'axios';

dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

/**
 * Deploy app to IPFS and pin it
 * 
 * @param {*} sourcePath 
 * @returns 
 */
async function deploy(sourcePath: string) {
    const pinata = pinataSDK(process.env.PINATA_IPFS_KEY, process.env.PINATA_IPFS_SECRET);

    // Test authentication
    await pinata.testAuthentication();

    // Add files to IPFS
    const result = await pinata.pinFromFS(sourcePath, {
        wrapWithDirectory: true,
        pinataMetadata: {
            keyvalues: {
                timeStamp: (new Date()).toISOString()
            }
        }
    });

    console.log(`Deploy result: ${JSON.stringify(result)}`);
    return result.IpfsHash;
}

/**
 * Invoke command against CloudFlare API
 * 
 * @param command Command to invoke
 * @returns Result json response
 *
 */
async function invokeCloudFlareCommand(command: string, type: string, data?: any) {
    var response : AxiosResponse;
    const config = { headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_APITOKEN}`,
        'Content-Type' : 'application/json' } };
    try {
        switch(type) {
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
async function updateTxtRecord(ipfsHash: string) {
    const baseCommand = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONEID}/dns_records`;
    const txtHostName = `_dnslink.${process.env.CLOUDFLARE_TXTHOSTNAME}.${process.env.CLOUDFLARE_DNSNAME}`;

    // Look up existing TXT record
    const getCommand = `${baseCommand}?type=TXT&name=${txtHostName}`;
    const getResponse = await invokeCloudFlareCommand(getCommand, 'get');
    const id = getResponse.result[0]?.id;

    // Create TXT record
    const createCommand = `${baseCommand}${id ? '/' + id : ''}`;
    const data = {
        type: 'TXT',
        name: txtHostName,
        content: `dnslink=/ipfs/${ipfsHash}`,
        ttl: 1
    }

    await invokeCloudFlareCommand(createCommand, id ? 'put' : 'post', data);
}

async function main() {
    var folderPath = process.argv[2];
    if (folderPath == null) {
        console.error("Please specific folder to upload");
        return;
    }
    console.log(`Mode: ${process.env.NODE_ENV}`)

    // Deploy app
    console.log(`Uploading folder at path: ${folderPath}`);
    const ipfsHash = await deploy(folderPath);

    // Update IPNS TXT record
    console.log(`Updating IPNS TXT record`);
    await updateTxtRecord(ipfsHash);

    console.log(`Done`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
