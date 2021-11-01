// Task to copy typechain generated contracts to frontend

import * as fsExtra from "fs-extra";
import { task } from "hardhat/config";

task("compile", "Copy typechain artifacts to front end")
  .setAction(
    async (
      { global, noTypechain }: { global: boolean; noTypechain?: boolean },
      { config },
      runSuper
    ) => {
      if (global) {
        return;
      }

      await runSuper();

      const typechain = config.typechain;
      await fsExtra.copy(typechain.outDir, "frontend/src/contracts-generated/typechain");
      await fsExtra.copy(typechain.outDir, "CanvasDataUpdater/src/contracts-generated/typechain");
      console.log("Copied typechain to frontend");
    }
  );
