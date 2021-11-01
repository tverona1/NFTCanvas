import Konva from "konva";
import { KonvaEventObject } from "konva/types/Node";
import React from "react";
import { Group, Image, Rect, Text } from "react-konva";
import AreaData from "./AreaData";
import ContractUtils from "./ContractUtils";

/**
 * Properties
 */
type Props = {
  // Area data
  areaData: AreaData;

  // Whether area is owned by wallet
  isOwned: boolean,

  // Whether canvas is being dragged
  isDragging: boolean,

  // Whether in purchase mode (i.e. wallet is connected)
  isPurchaseMode: boolean;

  // Callbacks
  getIpfsImage: (ipfsUri: string) => Promise<Uint8Array | null>;
  onSelectedOwnedArea: (areaData: AreaData) => void;

  onMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  onMouseOut: (e: KonvaEventObject<MouseEvent>) => void;
}

/**
 * React component that represents a data entry on the grid (includes image, clickable link etc)
 */
export default class AreaDataRect extends React.Component<Props> {
  // Whether we loaded our image
  loadedImage = false;

  // The group encompassing the data rect
  group?: Konva.Group;

  // The data rect image's HTML element
  image?: HTMLImageElement;

  constructor(props: Props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  /**
   * Called when component is mounted to DOM
   */
  async componentDidMount() {
    this.image = new window.Image();
    await this.loadIpfsImage();
  }

  /**
   * Called when properties are updated
   * 
   * @param prevProps previous properties
   */
  async componentDidUpdate(prevProps: Props) {
    if (prevProps.areaData.metadata.image !== this.props.areaData.metadata.image) {
      await this.loadIpfsImage();
    }
  }

  /**
   * Whether we're waiting to load image
   */
  private waitingToLoadImage() {
    return (this.props.areaData.metadata.image != null && !this.loadedImage);
  }

  /**
   * Determines whether image data is an SVG image
   * 
   * @param imageData image data
   * @returns whether image data is SVG
   */
  private isSVGImage(imageData: Uint8Array ): boolean {
    // Compare first byte to start tag '<' character
    if (imageData[0]===60) {
      return true;
    }
    return false;
  }

  /**
   * Loads image from ipfs
   */
  private async loadIpfsImage() {
    if (this.image != null && null != this.props.areaData.metadata.image) {
      try {
        var imgData = await this.props.getIpfsImage(this.props.areaData.metadata.image);
        if (imgData != null) {
          const isSVGImage = this.isSVGImage(imgData);
          this.image.onload = () => {
            if (this.group != null) {
              this.group.draw();
              this.loadedImage = true;
              this.forceUpdate();
            }
          }
          this.image.onerror = () => {
            console.error(`Error loading image at ${this.props.areaData.metadata.image}`);
            if (this.image != null) {
              if (this.image.src) {
                URL.revokeObjectURL(this.image.src)
              }
              this.image = new window.Image();
              this.forceUpdate();
            }
          }
          this.image.src = URL.createObjectURL(new window.Blob([imgData.buffer], isSVGImage ? {type:'image/svg+xml;charset=utf-8'} : {}));
        }
      } catch (error) {
        console.error(`Error loading IPFS image: ${error}`)
      }
    }
  }

  /**
   * Invoked then clicking on existing area
   */
  private onClick() {
    if (this.props.isDragging) {
      // If canvas is being dragged, skip
      return;
    }

    if (this.props.isPurchaseMode && this.props.isOwned) {
      // If in purchase mode & area is owned by wallet, invoke callback
      this.props.onSelectedOwnedArea(this.props.areaData);
    } else if (this.props.areaData.metadata.external_url != null) {
      // Otherwise, open link
      var url = this.props.areaData.metadata.external_url;
      if (!url.match(/^https?:\/\//i)) {
        url = 'http://' + url;
      }
      const newWindow = window.open(url, '_blank');
      if (newWindow != null) {
        newWindow.opener = null;
      }
    }
  }

  render() {
    const x = ContractUtils.convertFromBlockSize(this.props.areaData.size.x1);
    const y = ContractUtils.convertFromBlockSize(this.props.areaData.size.y1);
    const width = ContractUtils.convertFromBlockSize(this.props.areaData.size.x2) - x;
    const height = ContractUtils.convertFromBlockSize(this.props.areaData.size.y2) - y;

    return (
      <Group
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#ddd"
        onClick={() => this.onClick()}
        onMouseMove={this.props.onMouseMove}
        onMouseOut={this.props.onMouseOut}
        ref={node => {
          if (null != node) {
            this.group = node;
          }
        }}
      >
        <Rect
          width={width}
          height={height}
          fill="white"
          shadowColor="rgb(0, 161, 255)"
          shadowBlur={7}
          shadowEnabled={this.props.isOwned}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
          stroke="rgb(0, 161, 255)"
          strokeWidth={4}
          strokeEnabled={this.props.isOwned}
        />
        <Image
          width={width}
          height={height}
          image={this.image}
        />
        <Text
          width={width}
          height={height}
          align="center"
          ellipsis={true}
          padding={2}
          fontSize={8}
          fontFamily="Calibri"
          text="Loading..."
          visible={this.waitingToLoadImage()}
        />
      </Group>
    );
  }
}
