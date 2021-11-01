import { BigNumber, ethers } from "ethers";
import detectEthereumProvider from '@metamask/detect-provider';
import update from 'immutability-helper';
import ipfsClientFactory from "ipfs-http-client";

import React from "react";

// Dev contract
import { default as contractAddressDev } from "../contracts-generated/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryDev } from "../contracts-generated/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasDev } from "../contracts-generated/typechain/NFTCanvas";

// Rinkeby test network contract
import { default as contractAddressRinkeby } from "../contracts-generated-rinkeby/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryRinkeby } from "../contracts-generated-rinkeby/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasRinkeby } from "../contracts-generated-rinkeby/typechain/NFTCanvas";

// Mainnet contract
import { default as contractAddressMainnet } from "../contracts-generated-mainnet/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryMainnet } from "../contracts-generated-mainnet/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasMainnet } from "../contracts-generated-mainnet/typechain/NFTCanvas";

// Mumbai contract
import { default as contractAddressMumbai } from "../contracts-generated-mumbai/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryMumbai } from "../contracts-generated-mumbai/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasMumbai } from "../contracts-generated-mumbai/typechain/NFTCanvas";

// Polygon contract
import { default as contractAddressPolygon } from "../contracts-generated-polygon/contract-address.json";
import { NFTCanvas__factory as NFTCanvas__factoryPolygon } from "../contracts-generated-polygon/typechain/factories/NFTCanvas__factory";
import { NFTCanvas as NFTCanvasPolygon } from "../contracts-generated-polygon/typechain/NFTCanvas";

import AreaData from "./AreaData";
import AreaMetadata from "./AreaMetadata";
import CanvasGrid from "./CanvasGrid";
import ContractUtils from "./ContractUtils";
import { ToastMessageContainer, ErrorToast, PersistentToast, invokeSuccessToast } from "./ToastMessage";
import { Loading } from "./Loading";

import PurchaseAreaForm from "./PurchaseAreaForm";
import SelectionData from "./SelectionData";
import AreaSize from "./AreaSize";
import TransactionErrorMessage from "./TransactionErrorMessage";
import { Col, Container, Row } from "react-bootstrap";
import { resizeImage } from "./ImageUtils";
import IpfsUtils from "./IpfsUtils";

import "./App.css";
import { NetworkParams, POLYGON_MAINNET_CONFIG, POLYGON_MUMBAI_CONFIG } from "./NetworkConfig";
import SwitchNetworkDialog from "./SwitchNetworkDialog";

// Error code indicating that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Polling interval for canvas cached data
const POLL_INTERVAL_CANVAS_CACHE = 60 * 1000;

// Chain id to use
const CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID ?? "31337");

// Initialize Contract info depending on environment
var contractAddress = contractAddressDev;
var NFTCanvas__factory: typeof NFTCanvas__factoryDev | typeof NFTCanvas__factoryRinkeby | typeof NFTCanvas__factoryMainnet | typeof NFTCanvas__factoryMumbai | typeof NFTCanvas__factoryPolygon = NFTCanvas__factoryDev;
type NFTCanvas = NFTCanvasDev | NFTCanvasRinkeby | NFTCanvasMainnet | NFTCanvasMumbai | NFTCanvasPolygon;

switch (process.env.REACT_APP_ENV) {
  case "production":
    contractAddress = contractAddressMainnet;
    NFTCanvas__factory = NFTCanvas__factoryMainnet;
    break;
  case "test":
    contractAddress = contractAddressRinkeby;
    NFTCanvas__factory = NFTCanvas__factoryRinkeby;
    break;
  case "mumbai":
    contractAddress = contractAddressMumbai;
    NFTCanvas__factory = NFTCanvas__factoryMumbai;
    break;
  case "polygon":
    contractAddress = contractAddressPolygon;
    NFTCanvas__factory = NFTCanvas__factoryPolygon;
    break;
  }

// Token name and symbol
type TokenData = {
  name: string;
  symbol: string;
}

// Dapp state
type State = {
  // Token data
  tokenData?: TokenData;

  // Price of wei in US micros
  priceUSMicros?: BigNumber;

  // Whether we're in purchase mode
  isPurchaseMode: boolean;

  // Wallet address
  selectedAddress?: string;

  // Area data
  canvasData: Map<string, AreaData>;

  // Current selection
  currentSelection: SelectionData;

  // Whether to show network switch dialog
  showSwitchNetwork: boolean;

  // Transaction data when in-progress
  txInProgress: boolean;
  txBeingSent?: string;

  // Error fields
  networkError?: string;
  transactionError?: string;
  initializationError?: string | JSXElementError;

  // Zoom percent
  zoomPercent: number;
}

//export default CustomPopover;

type Props = {
  setShowConnectWallet: React.Dispatch<React.SetStateAction<boolean>>,
  setConnectWallet: React.Dispatch<React.SetStateAction<() => void>>,
  setZoomPercent: React.Dispatch<React.SetStateAction<number>>,
  setOnZoom: React.Dispatch<React.SetStateAction<(zoomPercent: number) => void>>,
  setTotalPixelsSold: React.Dispatch<React.SetStateAction<number>>,
  setPriceUSMicros: React.Dispatch<React.SetStateAction<number>>
}

class JSXElementError extends Error {
  element: JSX.Element;
  constructor(elem: JSX.Element) {
    super("error");
    this.element = elem;
  }
}

/**
 * Distributed app.
 * This component is in charge of:
 * 1. Loading current canvas state from IPFS (when user has not yet connect wallet)
 * 2. Connecting to user's wallet
 * 3. Initializing ethers and the token contract
 * 4. Purchasing area
 * 5. Setting metadata on area (image, link, title, etc)
 * 6. Renders the whole application
 */
export default class Dapp extends React.Component<Props, State> {
  state: State;
  private initialState: State;
  private initialSelectionData: SelectionData;
  private nftCanvas!: NFTCanvas;
  private ethProvider: any;
  private provider!: ethers.providers.Web3Provider;
  private pollDataInterval: any;
  private ipfsClient;
  private ipfsCacheDataLastModified?: string = undefined;
  private loadingIpfsCacheData = false;
  private ipfsGatewayPath?: string;
  private isComponentMounted = false;

  constructor(props: Props) {
    super(props);

    console.log(`Running application in ${process.env.REACT_APP_ENV} mode`);
    console.log(`IPFS host ${process.env.REACT_APP_IPFS_HOST}, port: ${process.env.REACT_APP_IPFS_PORT}, protocol: ${process.env.REACT_APP_IPFS_PROTOCOL}`);

    // Initialize IPFS client
    this.ipfsClient = ipfsClientFactory({
      host: process.env.REACT_APP_IPFS_HOST,
      port: parseInt(process.env.REACT_APP_IPFS_PORT ?? "5001"),
      protocol: process.env.REACT_APP_IPFS_PROTOCOL
    });

    this.ipfsGatewayPath = process.env.REACT_APP_IPFS_GATEWAY;

    // Initialize Dapp's state
    this.initialSelectionData = { selectionSize: { x1: 0, y1: 0, x2: 10, y2: 10 }, uri: "", name: "", description: "", isFree: false, isOwned: false };

    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      isPurchaseMode: false,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      txInProgress: false,
      transactionError: undefined,
      showSwitchNetwork: false,
      networkError: undefined,
      initializationError: undefined,
      canvasData: new Map<string, AreaData>(),
      zoomPercent: 0,

      currentSelection: this.initialSelectionData
    };

    this.state = this.initialState;

    // Bind this pointer
    this.calculatePriceUSD = this.calculatePriceUSD.bind(this);
    this.getImageFromIPFS = this.getImageFromIPFS.bind(this);
    this.getMetadataFromIPFS = this.getMetadataFromIPFS.bind(this);
    this.isWalletConnected = this.isWalletConnected.bind(this);
    this.loadCanvasDataFromIPFS = this.loadCanvasDataFromIPFS.bind(this);
    this.onImageResize = this.onImageResize.bind(this);
    this.onSelection = this.onSelection.bind(this);
    this.onSelectionSize = this.onSelectionSize.bind(this);
    this.onSelectedAreaData = this.onSelectedAreaData.bind(this);
    this.purchaseArea = this.purchaseArea.bind(this);
    this.updateArea = this.updateArea.bind(this);
    this.renderPurchaseViewStatus = this.renderPurchaseViewStatus.bind(this);
    this.connectWallet = this.connectWallet.bind(this);
    this.cancelPurchaseMode = this.cancelPurchaseMode.bind(this);
    this.onZoomPercent = this.onZoomPercent.bind(this);
    this.updateCanvasData = this.updateCanvasData.bind(this);
    this.isAreaOwned = this.isAreaOwned.bind(this);
    this.updateCurrentPriceUSMicrosFromCache = this.updateCurrentPriceUSMicrosFromCache.bind(this)

    props.setConnectWallet(() => this.connectWallet);
    props.setOnZoom(() => this.onZoomPercent);
  }

  /**
   * Renders the purchase view
   * 
   * @returns JSX.Element
   */
  private renderPurchaseViewStatus(): JSX.Element | null {
    if (this.state.initializationError) {
      if (this.state.initializationError instanceof JSXElementError) {
        return (<ErrorToast
          message={this.state.initializationError.element}
          onClose={() => this.dismissInitializationError()} />);
      } else {
        return (<ErrorToast
          message={`Initialization Error: ${this.getRpcErrorMessage(this.state.initializationError)}`}
          onClose={() => this.dismissInitializationError()} />);
      }
    }

    if (this.state.networkError) {
      return (<ErrorToast
        message={this.state.networkError}
        onClose={() => this.dismissNetworkError()} />);
    }

    if (this.state.showSwitchNetwork) {
      return (<SwitchNetworkDialog show={this.state.showSwitchNetwork} networkName={this.getNetworkName()} onClose={() => { this.setState({ showSwitchNetwork: false}) }} onSwitch={()=>this.switchNetwork()} />);
    }

    // If not connected to wallet, return
    if (!this.state.selectedAddress) {
      return (null);
    }

    // If the token data isn't loaded yet, show a loading component
    if (!this.state.tokenData) {
      return <Loading />;
    }

    return (null);
  }

  render() {
    return (
      <div>
        <ToastMessageContainer />
        {this.state.txInProgress && <PersistentToast message="Waiting for transaction" />}
        {this.state.transactionError && (
          <TransactionErrorMessage
            message={this.getRpcErrorMessage(this.state.transactionError)}
            dismiss={() => this.dismissTransactionError()}
          />
        )}
        <Container fluid className="h-100">
          <Row>
            <this.renderPurchaseViewStatus />
            {/*
            <div className="center">
              <DataList areaDataMap={this.state.canvasData}></DataList>
            </div>
            */}
          </Row>
          <Row>
            <Col xs={this.isPurchaseMode() ? 12 : 12}>
              <CanvasGrid canvasData={this.state.canvasData} selectionData={this.state.currentSelection} isPurchaseMode={this.isPurchaseMode()} walletAddress={this.state.selectedAddress} onSelectionSize={this.onSelectionSize} onSelectedAreaData={this.onSelectedAreaData}
                onImageResize={this.onImageResize} getIpfsImage={this.getImageFromIPFS} isAreaOwned={this.isAreaOwned} zoomPercent={this.state.zoomPercent} onZoom={this.onZoomPercent} />
            </Col>
          </Row>
        </Container>
        {this.isPurchaseMode() &&
          <PurchaseAreaForm txInProgress={this.state.txInProgress} currentSelection={this.state.currentSelection} calculatePrice={this.calculatePriceUSD}
            onPurchase={this.purchaseArea} onUpdate={this.updateArea} onCancel={this.cancelPurchaseMode} onSelection={this.onSelection} onImageResize={this.onImageResize} />
        }
      </div>
    )
  }

  /**
   * Calls when component is loaded into DOM
   */
  async componentDidMount() {
    this.isComponentMounted = true;
    this.props.setShowConnectWallet(!this.state.initializationError && !this.state.isPurchaseMode);
    this.props.setZoomPercent(this.state.zoomPercent);
    this.props.setTotalPixelsSold(this.calcSoldPixels());
    if (this.state.priceUSMicros) {
      this.props.setPriceUSMicros(this.state.priceUSMicros.toNumber());
    }

    // Initialize canvas data from IPFS
    this.ipfsCacheDataLastModified = undefined;
    await this.loadCanvasDataFromIPFS();

    this.startPollingData();
  }

  /**
   * Calls when component is about to be unloaded from DOM
   */
  componentWillUnmount() {
    this.isComponentMounted = false;
    this.stopPollingData();

    try {
      // Remove all event listeners from contract
      if (this.nftCanvas) {
        this.nftCanvas.removeAllListeners();
      }
    } catch (error) {
      console.error(`Error removing all listeners: ${error}`);
    }
  }

  /**
   * Called when component's properties and state are updated
   * @param prevProps previous properties
   * @param prevState previous state
   */
  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.isPurchaseMode !== prevState.isPurchaseMode || this.state.initializationError !== prevState.initializationError) {
      this.props.setShowConnectWallet(!this.state.initializationError && !this.state.isPurchaseMode);
    }

    if (this.state.zoomPercent !== prevState.zoomPercent) {
      this.props.setZoomPercent(this.state.zoomPercent);
    }

    if (this.state.canvasData !== prevState.canvasData) {
      this.props.setTotalPixelsSold(this.calcSoldPixels());
    }

    if (this.state.priceUSMicros !== prevState.priceUSMicros && this.state.priceUSMicros != null) {
      this.props.setPriceUSMicros(this.state.priceUSMicros.toNumber());
    }

    // If original image file changed, produce resized image
    const differentImageFile = prevState.currentSelection.imageFile !== this.state.currentSelection.imageFile;
    if (differentImageFile) {
      this.onImageResize();
    }
  }

  /**
   * Connect to user's wallet 
   */
  private async connectWallet() {
    console.log("Connecting to wallet");

    try {
      if (this.isWalletConnected()) {
        // If we're already connected, bail early
        this.setState({ isPurchaseMode: true });
        return;
      }

      this.ethProvider = await detectEthereumProvider({ silent: true, timeout: 1000 });
      if (this.ethProvider == null) {
        throw new JSXElementError(<div>Metamask plugin not found. Please install <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" style={{ filter: "brightness(200%)" }}>Metamask</a>.</div>);
      } else if (this.ethProvider !== window.ethereum) {
        throw new Error("Multiple wallets installed. Please ensure only one wallet is enabled at a time.");
      }

      // Check the network
      if (!(await this.checkNetwork())) {
        return;
      }

      var [selectedAddress] = await this.ethProvider.request({ method: 'eth_accounts' });
      if (selectedAddress == null) {
        // Connect to account
        selectedAddress = await this.connectAccount();
      }

      // Initialize contract
      await this.initializeContractData(selectedAddress);

      // Reinitialize whenever user changes account
      this.ethProvider.on("accountsChanged", ([newAddress]: string[]) => {
        // If user removes Dapp from connect list of sites, reset state
        if (newAddress == null) {
          return this.resetState();
        }

        try {
          this.initializeContractData(newAddress);
          } catch (error) {
            console.error(`Initialize contract data error: ${error}`);
            this.setState({ initializationError: error })
          }
      });

      // We reset the dapp state if the network is changed
      this.ethProvider.on("chainChanged", (chainId: string) => {
        if (parseInt(chainId) !== CHAIN_ID) {
          // If switching to expected id, don't reload.
          window.location.reload();
        }
      });
    } catch (error) {
      console.error(`Initialize error: ${error}`);
      this.setState({ initializationError: error })
    }
  }

  private async connectAccount(): Promise<string> {
    try {
      // Connect to wallet
      const [selectedAddress] = await this.ethProvider.request({ method: 'eth_requestAccounts' })
      return selectedAddress;
    } catch (error) {
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        throw new JSXElementError(<div>Please connect to Metamask.</div>);
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize contract connection and data
   * 
   * @param userAddress user's address
   */
  private async initializeContractData(userAddress: string) {
    console.log(`Initializing with address: ${userAddress}`);

    // Store user's address
    this.setState({
      selectedAddress: userAddress,
    });

    // Initialize ethers
    this.provider = new ethers.providers.Web3Provider(this.ethProvider);

    // Connect to contract
    this.nftCanvas = NFTCanvas__factory.connect(
      contractAddress.Contract,
      this.provider.getSigner(0)
    );

    console.log(`Contract address: ${contractAddress.Contract}`);
    console.log(`Signer: ${await this.provider.getSigner(0).getAddress()}`);

    // Get contract data
    await this.getContractData();
  }

  /*
  async wait(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }*/

  /**
   * Start polling data
   */
  private startPollingData() {
    // Periodically refresh canvas data from IPFS
    this.pollDataInterval = setInterval(() => this.loadCanvasDataFromIPFS(), POLL_INTERVAL_CANVAS_CACHE);
  }

  /**
   * Stop polling data
   */
  private stopPollingData() {
    clearInterval(this.pollDataInterval);
    this.pollDataInterval = undefined;
  }

  private calcSoldPixels(): number {
    var totalPixels = 0;
    for (var areaData of this.state.canvasData.values()) {
      const areaSize = (areaData.size.x2 - areaData.size.x1) * (areaData.size.y2 - areaData.size.y1);
      totalPixels += areaSize * ContractUtils.BLOCKSIZE * ContractUtils.BLOCKSIZE;
    }

    return totalPixels;
  }

  /**
   * Update current price in US Micros
   * 
   */
  private async updateCurrentPriceUSMicros() {
    const priceUSMicros = await this.nftCanvas.getCurrentPriceUSMicros();
    console.log(`Current price: ${priceUSMicros / 10000} cents`);
    this.setState({ priceUSMicros: priceUSMicros });
  }

  /**
   * Update current price in US micros from cache
   * 
   * @param curPriceUSMicros - current price in US micros
   */
  private updateCurrentPriceUSMicrosFromCache(curPriceUSMicros: BigNumber) {
    console.log(`Current price from cache: ${curPriceUSMicros.toNumber() / 10000} cents`);
    this.setState({ priceUSMicros: curPriceUSMicros });
  }

  /**
   * Get contract data, including all metadata events
   */
  private async getContractData() {
    // Get current price in US micros
    await this.updateCurrentPriceUSMicros();

    // Get initial set of events
    this.initializeCanvasData();

    // Listen for metadata events
    this.nftCanvas.on("MetadataEvent", (index: BigNumber, owner: string, x1: number, y1: number, x2: number, y2: number, tokenId: BigNumber, tokenUri: string) => {
      (async() => {
        try {
          await this.updateCanvasData(owner, tokenId, tokenUri);
          await this.updateCurrentPriceUSMicros();
        } catch (error) {
          console.error(`MetadataEvent callback error: ${error}`);
          this.setState({ initializationError: error })
        }
      })();
    });

    // Listen for transfer events
    this.nftCanvas.on("Transfer", (from: string, to: string, tokenId: BigNumber) => {
      (async() => {
          try {
          await this.updateCanvasDataOwner(from, to, tokenId);
          await this.updateCurrentPriceUSMicros();
        } catch (error) {
          console.error(`Transfer callback error: ${error}`);
          this.setState({ initializationError: error })
        }
      })();
    });

    // Get token name and symbol
    const name = await this.nftCanvas.name();
    const symbol = await this.nftCanvas.symbol();
    console.log(`Token name: ${name}, symbol: ${symbol}`);
    this.setState({ tokenData: { name, symbol } });
    this.setState({ isPurchaseMode: true });
  }

  /**
   * Convert token id to area
   * 
   * @param tokenId input token id
   * @returns area size
   */
  private areaSizeFromTokenId(tokenId: BigNumber): AreaSize {
    const x1 = tokenId.mask(16).toNumber();
    const y1 = tokenId.shr(16).mask(16).toNumber();

    const upper = tokenId.shr(32).mask(32);
    const x2 = upper.mask(16).toNumber();
    const y2 = upper.shr(16).mask(16).toNumber();
    return { x1: x1, x2: x2, y1: y1, y2: y2 };
  }

  /**
   * Initialize canvas data from contract by querying for metadata events
   */
  private async initializeCanvasData() {
    if (this.state.selectedAddress == null) {
      return;
    }

    const totalTokens = (await this.nftCanvas.totalSupply()).toNumber();
    for (var i = 0; i < totalTokens; i++) {
      const tokenId = await this.nftCanvas.tokenByIndex(i);
      const tokenURI = await this.nftCanvas.tokenURI(tokenId);
      const owner = await this.nftCanvas.ownerOf(tokenId);

      await this.updateCanvasData(owner, tokenId, tokenURI);
    }
  }

  /**
   * Update owner for given token id
   * 
   * @param from - from address
   * @param to - to address
   * @param tokenId - token id
   */
  private async updateCanvasDataOwner(from: string, to: string, tokenId: BigNumber) {
    const existingAreaData = this.state.canvasData.get(tokenId.toString());
    if (existingAreaData == null) {
      // Transfer event may precede Metadata event, so skip if we don't have entry yet
      return;
    }

    if (existingAreaData.owner.toUpperCase() === to.toUpperCase()) {
      // No op, so bail
      return;
    }

    const areaData: AreaData = {
      owner: to, tokenId: existingAreaData.tokenId, tokenUri: existingAreaData.tokenUri,
      size: { x1: existingAreaData.size.x1, y1: existingAreaData.size.y1, x2: existingAreaData.size.x2, y2: existingAreaData.size.y2 }, metadata: existingAreaData.metadata
    };

    // Update state
    this.setState(prevState => ({
      canvasData: update(prevState.canvasData, { $add: [[areaData.tokenId.toString(), areaData]] })
    }));
  }

  /**
   * Update canvas data
   */
  private async updateCanvasData(owner: string, tokenId: BigNumber, uri: string) {
    var metadata: AreaMetadata | null = null;
    const existingAreaData = this.state.canvasData.get(tokenId.toString());

    if (existingAreaData != null && existingAreaData.owner.toUpperCase() === owner.toUpperCase() && existingAreaData.tokenUri === uri) {
      // No change, return
      return;
    }

    if (existingAreaData != null) {
      if (existingAreaData.tokenUri !== uri) {
        // Get metadata from IPFS
        metadata = await this.getMetadataFromIPFS(uri);
      } else {
        metadata = existingAreaData.metadata;
      }
    } else {
      // Get metadata from IPFS
      metadata = await this.getMetadataFromIPFS(uri);
    }

    if (metadata == null) {
      // If we can't get metadata, log error and return
      console.error(`Can't get metadata for tokenId ${tokenId} from uri ${uri}`);
      return;
    }

    const areaSize = this.areaSizeFromTokenId(tokenId);
    const areaData: AreaData = { owner: owner, tokenId: tokenId, tokenUri: uri, size: { x1: areaSize.x1, y1: areaSize.y1, x2: areaSize.x2, y2: areaSize.y2 }, metadata: metadata };

    if (!this.isComponentMounted) {
      // If we're unmounted, bail
      return;
    }

    // Update state
    this.setState(prevState => ({
      canvasData: update(prevState.canvasData, { $add: [[areaData.tokenId.toString(), areaData]] })
    }));
  }

  private isAreaOwned(areaData: AreaData): boolean {
    return this.state.selectedAddress != null && this.state.selectedAddress.toUpperCase() === areaData.owner.toUpperCase();
  }

  /**
   * Whether two areas match in location & size
   * 
   * @param area1
   * @param area2 
   * @returns 
   */
  private isAreaMatching(area1: AreaSize, area2: AreaSize): boolean {
    return area1.x1 === area2.x1 && area1.x2 === area2.x2 && area1.y1 === area2.y1 && area1.y2 === area2.y2;
  }

  /**
   * Whether two areas are intersecting
   * 
   * @param area1 
   * @param area2 
   * @returns 
   */
  private isAreaIntersecting(area1: AreaSize, area2: AreaSize): boolean {
    return !(
      area2.x1 >= area1.x2 ||
      area2.x2 <= area1.x1 ||
      area2.y1 >= area1.y2 ||
      area2.y2 <= area1.y1
    );
  }

  /**
   * Determines if given selection size is free or owned by current wallet
   * 
   * @param selectionSize 
   * @returns 
   */
  private isSelectionFreeOrOwned(selectionSize: AreaSize): { isFree: boolean, isOwned: boolean } {
    for (var areaData of this.state.canvasData.values()) {
      const isIntersecting = this.isAreaIntersecting(selectionSize, areaData.size);
      if (isIntersecting) {
        if (this.isAreaMatching(selectionSize, areaData.size) && this.isAreaOwned(areaData)) {
          return { isFree: false, isOwned: true };
        }
        return { isFree: false, isOwned: false }
      }
    }

    return { isFree: true, isOwned: false };
  }

  /**
   * Calculate prize of selection size in US dollars
   * 
   * @param selectionSize selection size
   * @returns private in US dollars
   */
  private calculatePriceUSD(selectionSize: AreaSize): number {
    return Math.round((selectionSize.x2 - selectionSize.x1) * (selectionSize.y2 - selectionSize.y1) * this.priceUSMicroPerPixel() * ContractUtils.BLOCKSIZE * ContractUtils.BLOCKSIZE) / 1000000;
  }

  /**
   * Callback invoked when selection data changes
   * 
   * @param selectionData selection data
   */
  private onSelection(selectionData: SelectionData) {
    // Update state
    this.setState({ currentSelection: selectionData });
  }

  /**
   * Callback invoked when selection size changes
   * 
   * @param selectionSize selection size
   */
  private onSelectionSize(selectionSize: AreaSize) {
    const isFreeOrOwned = this.isSelectionFreeOrOwned(selectionSize);

    this.onSelection({
      uri: this.state.currentSelection.uri,
      selectionSize: selectionSize,
      name: this.state.currentSelection.name,
      description: this.state.currentSelection.description,
      imageFile: this.state.currentSelection.imageFile,
      resizedImageURL: this.state.currentSelection.resizedImageURL,
      imageIpfsURL: this.state.currentSelection.imageIpfsURL,
      isFree: isFreeOrOwned.isFree,
      isOwned: isFreeOrOwned.isOwned
    });
  }

  /**
   * Callback invoked when area data
   * 
   * @param areaData - area data
   */
  private onSelectedAreaData(areaData: AreaData) {
    const isFreeOrOwned = this.isSelectionFreeOrOwned(areaData.size);

    this.onSelection({
      uri: areaData.metadata.external_url ?? "",
      selectionSize: areaData.size,
      name: areaData.metadata.name,
      description: areaData.metadata.description ?? "",
      imageFile: this.state.currentSelection.imageFile,
      resizedImageURL: this.state.currentSelection.resizedImageURL,
      imageIpfsURL: areaData.metadata.image,
      isFree: isFreeOrOwned.isFree,
      isOwned: isFreeOrOwned.isOwned
    });

    this.onImageResize();
  }

  /**
   * Callback invoked when selection image needs to be regenerated.
   */
  private onImageResize() {
    if (null != this.state.currentSelection.imageFile) {
      // Get selection dimensions
      const width = ContractUtils.convertFromBlockSize(this.state.currentSelection.selectionSize.x2 - this.state.currentSelection.selectionSize.x1);
      const height = ContractUtils.convertFromBlockSize(this.state.currentSelection.selectionSize.y2 - this.state.currentSelection.selectionSize.y1);

      resizeImage(this.state.currentSelection.imageFile, width, height).then(resizeImageURL => {
        if (null != resizeImageURL) {
          // Update state with image url
          if (null != this.state.currentSelection.resizedImageURL) {
            URL.revokeObjectURL(this.state.currentSelection.resizedImageURL);
          }

          this.onSelection({
            uri: this.state.currentSelection.uri,
            selectionSize: this.state.currentSelection.selectionSize,
            name: this.state.currentSelection.name,
            description: this.state.currentSelection.description,
            imageFile: this.state.currentSelection.imageFile,
            resizedImageURL: resizeImageURL,
            imageIpfsURL: this.state.currentSelection.imageIpfsURL,
            isFree: this.state.currentSelection.isFree,
            isOwned: this.state.currentSelection.isOwned
          });
        }
      }).catch(() => {
        console.error(`On image resize error`);
      })
    }
  }

  /**
   * Loads image from IPFS
   * 
   * @param ipfsUri Image URI from IPFS
   * @returns Byte array
   */
  private async getImageFromIPFS(ipfsUri: string): Promise<Uint8Array | null> {
    return await IpfsUtils.getImageFromIPFS(this.ipfsClient, ipfsUri);
  }

  /**
   * Loads json metadata from IPFS
   * @param ipfsUri JSON URI from IPFS
   * @returns area metadata
   */
  private async getMetadataFromIPFS(ipfsUri: string): Promise<AreaMetadata | null> {
    return await IpfsUtils.getMetadataFromIPFS(this.ipfsClient, ipfsUri);
  }

  /**
   * Load canvas data pre-cached in IPFS
   */
  private async loadCanvasDataFromIPFS(): Promise<void> {
    if (this.isWalletConnected() || this.loadingIpfsCacheData) {
      // If we're already loading, bail
      // Also, if wallet is connected, we'll get canvas data directly from the blockchain, so no 
      // need to load cached data
      return;
    }

    this.loadingIpfsCacheData = true;
    this.ipfsCacheDataLastModified = await IpfsUtils.loadCanvasDataFromIPFS(this.ipfsGatewayPath, this.ipfsCacheDataLastModified, this.updateCanvasData, this.updateCurrentPriceUSMicrosFromCache);
    this.loadingIpfsCacheData = false;
  }

  /**
   * Upload metadata to IPFS including image & json file
   * @returns ipfs cid
   */
  private async uploadMetadataToIPFS(): Promise<string> {
    return await IpfsUtils.uploadMetadataToIPFS(this.ipfsClient, this.state.currentSelection.name, this.state.currentSelection.description, this.state.currentSelection.uri, this.state.currentSelection.resizedImageURL, this.state.currentSelection.imageIpfsURL);
  }

  private onTxSuccess() {
    invokeSuccessToast("Transaction successful");
  }

  /**
   * Purchase area based on current selection
   */
  private async purchaseArea() {
    try {
      this.dismissTransactionError();
      this.setState({ txInProgress: true });

      // First upload data to IPFS
      const tokenURI = await this.uploadMetadataToIPFS();

      const x1 = this.state.currentSelection.selectionSize.x1;
      const x2 = this.state.currentSelection.selectionSize.x2;
      const y1 = this.state.currentSelection.selectionSize.y1;
      const y2 = this.state.currentSelection.selectionSize.y2;

      console.log(`Purchasing area with area x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}, uri: ${tokenURI}`);
      // Calculate block price
      const blockPrice = (await this.nftCanvas.getAreaPrice(x1, y1, x2, y2));
      console.log(`Price in Wei: ${blockPrice}`);

      // Send the transaction and save its hash in the Dapp's state
      const tx = await this.nftCanvas.purchaseArea(x1, y1, x2, y2, tokenURI, { value: blockPrice });
      this.setState({ txBeingSent: tx.hash });

      // Wait for the transaction to be mined. This method returns the transaction's receipt
      const receipt = await tx.wait();

      // Status flag of 0 on receipt incdicates an error
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      // Transaction was successful
      this.onTxSuccess();
    } catch (error) {
      // If user rejected the transaction, ignore
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Log error and set tx error state
      console.error(`Transaction Error: ${JSON.stringify(error)}`);
      this.setState({ transactionError: error });
    } finally {
      // Finally, clear tx state
      this.setState({ txBeingSent: undefined });
      this.setState({ txInProgress: false });
    }
  }

  /**
   * Update area based on current selection
   */
  private async updateArea() {
    try {
      this.dismissTransactionError();
      this.setState({ txInProgress: true });

      // First upload data to IPFS
      const tokenURI = await this.uploadMetadataToIPFS();

      const x1 = this.state.currentSelection.selectionSize.x1;
      const x2 = this.state.currentSelection.selectionSize.x2;
      const y1 = this.state.currentSelection.selectionSize.y1;
      const y2 = this.state.currentSelection.selectionSize.y2;

      console.log(`Updating area with area x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}, uri: ${tokenURI}`);

      // Send the transaction and save its hash in the Dapp's state
      const tx = await this.nftCanvas.setMetadataOnArea(x1, y1, x2, y2, tokenURI);
      this.setState({ txBeingSent: tx.hash });

      // Wait for the transaction to be mined. This method returns the transaction's receipt
      const receipt = await tx.wait();

      // Status flag of 0 on receipt incdicates an error
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      // Transaction was successful
      this.onTxSuccess();
    } catch (error) {
      // If user rejected the transaction, ignore
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Log error and set tx error state
      console.error(`Transaction Error: ${JSON.stringify(error)}`);
      this.setState({ transactionError: error });
    } finally {
      // Finally, clear tx state
      this.setState({ txBeingSent: undefined });
      this.setState({ txInProgress: false });
    }
  }

  /**
   * Cancel purchase mode
   */
  private cancelPurchaseMode() {
    // Clear current image if any
    if (null != this.state.currentSelection.resizedImageURL) {
      URL.revokeObjectURL(this.state.currentSelection.resizedImageURL);
    }

    this.setState({
      isPurchaseMode: false,
      currentSelection: this.initialSelectionData
    });
  }

  /**
   * Clears tx error state
   */
  private dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  /**
   * Clears initializer error state
   */
  private dismissInitializationError() {
    this.resetState();
  }

  /**
   * Clears network error state
   */
  private dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  /**
   * Helper method to get user readable RPC error
   * 
   * @param error RPC error
   * @returns Error string
   */
  private getRpcErrorMessage(error: any): string {
    if (error.reason && error.code) {
      return `${error.reason} (code: ${error.code})`;
    } else if (error.reason) {
      return `${error.reason}`;
    } else if (error.error && error.error.message) {
      return error.error.message;
    } else if (error.data && error.data.message) {
      return error.data.message;
    } else if (error.message) {
      return error.message;
    } else if (typeof error === 'string' || error instanceof String) {
      return String(error);
    }

    return "Unknown error";
  }

  /**
   * Computes price per pixel in USD
   * 
   * @returns prices per pixel in USD
   */
  private priceUSMicroPerPixel(): number {
    const priceNumber = this.state.priceUSMicros?.toNumber();
    if (priceNumber !== undefined) {
      return priceNumber;
    } else {
      return 0;
    }
  }

  /**
  * Update zoom percent state
  * @param zoomPercent 
  */
  private onZoomPercent(zoomPercent: number) {
    this.setState({ zoomPercent: zoomPercent });
  }

  /**
   * Resets the state
   */
  private resetState() {
    this.setState(this.initialState);
  }

  /**
   * Checks whether wallet is connected
   * @returns true if wallet is connected
   */
  private isWalletConnected(): boolean {
    return this.state.tokenData != null;
  }

  private isPurchaseMode(): boolean {
    return this.isWalletConnected() && this.state.isPurchaseMode;
  }

  private async switchNetwork() {
    var networkParams: NetworkParams | undefined = undefined;
    switch (CHAIN_ID) {
      case 80001:
        networkParams = POLYGON_MUMBAI_CONFIG;
        break;
      case 137:
        networkParams = POLYGON_MAINNET_CONFIG;
        break;
    }

    try {
      if (networkParams == null) {
        console.log(`Unexpected network type: ${CHAIN_ID}`)
        throw new Error(`Unexpected network type: ${CHAIN_ID}`);
      }

      await this.ethProvider.request({
        method: 'wallet_addEthereumChain',
        params: [networkParams]
      });

      // Re-connect wallet
      await this.connectWallet();
    } catch (error) {
      const errorMessage = this.getRpcErrorMessage(error);
      console.error(`Error adding network: ${errorMessage}`);
      this.setState({
        networkError: errorMessage
      });
    }
  }

  /**
   * Get user-friendly network name
   */
  private getNetworkName(): string {
    switch (CHAIN_ID) {
      case 31337:
        return "Localhost:8545";
      case 1:
        return "Ethereum Main Network";
      case 3:
        return "Ropsten Test Network";
      case 4:
        return "Rinkeby Test Network";
      case 80001:
        return "Mumbai Test Network";
      case 137:
        return "Polygon Main Network";
      default:
        return "Unknown Network";
    }
  }

  /**
   * Verifies selected chain id
   * @returns 
   */
  private async checkNetwork(): Promise<boolean> {
    const chainId = parseInt(await this.ethProvider.request({ method: 'eth_chainId' }));
    if (chainId === CHAIN_ID) {
      this.setState({ showSwitchNetwork: false });
      return true;
    }

    console.log(`Chain id: ${chainId}, expected: ${CHAIN_ID}`);
    switch (CHAIN_ID) {
      case 80001:
      case 137:
          this.setState({ showSwitchNetwork: true });
        break;
      default:
        this.setState({
          networkError: `Please connect wallet to ${this.getNetworkName()}`
        });
    }

    return false;
  }
}
