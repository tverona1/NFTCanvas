import AreaSize from "./AreaSize";

/**
 * Type representing current selection data
 */
type SelectionData = {
  selectionSize: AreaSize;
  name: string;
  description: string;
  uri: string;
  imageFile?: File;
  resizedImageURL?: string;
  imageIpfsURL?: string;
  isFree: boolean;
  isOwned: boolean;
}

export default SelectionData;