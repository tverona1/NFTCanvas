import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from 'dotenv';
import "hardhat-deploy-ethers";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "hardhat-typechain";
import "@typechain/ethers-v5";
import "@nomiclabs/hardhat-etherscan";

import "./tasks/typechaintofrontend";

dotenv.config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      gas: 1000000000,
      blockGasLimit: 1000000000,
      accounts: {
        mnemonic: process.env.PASS_PHRASE,
      },
      forking: {
        url: process.env.ALCHEMY_MAINNET_RPC_URL,
        blockNumber: 12034582
      }
    },
    rinkeby: {
      url: process.env.ALCHEMY_RINKEBY_RPC_URL,
      accounts: [process.env.RINKEBY_PRIVATE_KEY]
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_RPC_URL,
      accounts: [process.env.MAINNET_PRIVATE_KEY]
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.MUMBAI_PRIVATE_KEY]
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.POLYGON_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
//  gasReporter: {
//    currency: "USD",
//    enabled: (process.env.REPORT_GAS) ? true : false
//  },
  solidity: {
    compilers: [
      {
        version: "0.7.3",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50,
          },
        },
      },
    ],
  },
};
export default config;
  