import * as dotenv from 'dotenv';
import hre from "hardhat";

dotenv.config();

async function main() {
  console.log(`Verifying contract at address ${process.env.POLYGON_CONTRACT_ADDRESS}`);

  await hre.run("verify:verify", {
    address: process.env.POLYGON_CONTRACT_ADDRESS,
    constructorArguments: [
      [2592, 5184, 10368, 20736, 41472, 82994], [10, 100, 1000, 10000, 100000, 1000000], [2592, 5184, 10368, 20736, 41472, 82994]
    ]
  })

  console.log(`Verified contract`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
