import { ethers, artifacts } from "hardhat";

const ContractName = "NFTCanvas";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const factory = await ethers.getContractFactory(ContractName);

  // Initialize contract with price tiers
  let contract = await factory.deploy([2592, 5184, 10368, 20736, 41472, 82994], [10, 100, 1000, 10000, 100000, 1000000], [2592, 5184, 10368, 20736, 41472, 82994]);

  // The transaction that was sent to the network to deploy the Contract
  console.log("Deploy transaction: " + contract.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await contract.deployed();

  console.log("Contract address:", contract.address);

  // We also save the contract's artifacts and address in the frontend & event processor directories
  copyContractArtifacts(contract.address, __dirname + "/../frontend/src/contracts-generated");
  copyContractArtifacts(contract.address, __dirname + "/../CanvasDataUpdater/src/contracts-generated");
}

function copyContractArtifacts(address: String, outputPath: string) {
  const fs = require("fs");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  fs.writeFileSync(
    outputPath + "/contract-address.json",
    JSON.stringify({ Contract: address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync(ContractName);

  fs.writeFileSync(
    outputPath + `/${ContractName}.json`,
    JSON.stringify(TokenArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
