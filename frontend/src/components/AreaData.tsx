import { BigNumber } from "@ethersproject/bignumber";
import AreaMetadata from "./AreaMetadata";
import AreaSize from "./AreaSize";

/**
 * Type representing an owned area on the grid
 */
type AreaData = {
  tokenId: BigNumber;
  owner: string;
  tokenUri: string;
  metadata: AreaMetadata;
  size: AreaSize;
}

export default AreaData;