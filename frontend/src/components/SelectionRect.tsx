import React from "react";
import Konva from "konva";
import { Rect, Image, Circle, Group } from "react-konva";
import ContractUtils from "./ContractUtils";
import SelectionData from "./SelectionData";
import AreaSize from "./AreaSize";
import { KonvaEventObject } from "konva/types/Node";
import { Vector2d } from "konva/types/types";

/**
 * Properties
 */
type Props = {
  // Current selection data
  selectionData: SelectionData;

  // Stage scale
  stageScale?: number,

  // Callbacks
  onSelectionSize: (selectionSize: AreaSize) => void;
  onImageResize: () => void;
  onStartDragSelection: () => void;
  onStopDragSelection: () => void;
}

// Anchor indexes
const topLeft = 0;
const topRight = 1;
const bottomLeft = 2;
const bottomRight = 3;

/**
 * The selection box, including image, bounding rectangle, anchors etc.
 */
export default class SelectionRect extends React.Component<Props> {
  // Max anchor scale size
  static readonly MAX_ANCHOR_SCALE_FACTOR = 4;

  // Whether we're resizing
  resizing = false;

  // Initial position and size
  initX = 0;
  initY = 0;
  initWidth = 0;
  initHeight = 0;

  // The group encompassing the selection
  group?: Konva.Group;

  // The selected image's HTML element
  image?: HTMLImageElement;

  // Selection anchors
  anchors: Konva.Shape[] = [];

  constructor(props: Props) {
    super(props);

    // Initialize position & size
    this.initX = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.x1);
    this.initY = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.y1);
    this.initWidth = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.x2) - this.initX;
    this.initHeight = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.y2) - this.initY;

    this.onSelectionChangeNode = this.onSelectionChangeNode.bind(this);
    this.updateSize = this.updateSize.bind(this);
    this.boundAnchor = this.boundAnchor.bind(this);
    this.onAnchorDragMove = this.onAnchorDragMove.bind(this);
    this.onAnchorMouseDown = this.onAnchorMouseDown.bind(this);
    this.onAnchorDragEnd = this.onAnchorDragEnd.bind(this);
    this.onAnchorMouseOver = this.onAnchorMouseOver.bind(this);
    this.onAnchorMouseOut = this.onAnchorMouseOut.bind(this);
  }

  /**
   * Called when component is mounted to DOM
   */
  componentDidMount() {
    if (null != this.group) {
      // Add anchors
      this.anchors[topLeft] = this.group.find('.topLeft')[0] as Konva.Shape;
      this.anchors[topRight] = this.group.find('.topRight')[0] as Konva.Shape;
      this.anchors[bottomLeft] = this.group.find('.bottomLeft')[0] as Konva.Shape;
      this.anchors[bottomRight] = this.group.find('.bottomRight')[0] as Konva.Shape;

      // Set initial anchor scale
      this.scaleAnchors();
      this.adjustAnchorOffset();
    }

    // Initialize current selection info (i.e. is owned / free)
    this.props.onSelectionSize(this.props.selectionData.selectionSize);

    this.image = new window.Image();
  }

  /**
   * Called when properties are updated
   * 
   * @param prevProps previous properties
   */
  componentDidUpdate(prevProps: Props) {
    // If resized image URL is set, initialize the image with it
    if (this.image != null && prevProps.selectionData.resizedImageURL !== this.props.selectionData.resizedImageURL && null != this.props.selectionData.resizedImageURL) {
      this.image.onload = () => {
        if (this.group != null) {
          this.group.getParent().draw();
          this.forceUpdate();
        }
      }
      this.image.src = this.props.selectionData.resizedImageURL;
    }

    if (prevProps.stageScale !== this.props.stageScale) {
      this.scaleAnchors();
      this.adjustAnchorOffset();
    }

    if (prevProps.selectionData.selectionSize !== this.props.selectionData.selectionSize) {
      this.adjustAnchorOffset();
    }
  }

  /**
   * Callback when selection size or position changes on given node
   * 
   * @param node Node object
   */
  private onSelectionChangeNode(node: Konva.Node) {
    this.onSelectionChange({ x: node.position().x, y: node.position().y, width: node.width(), height: node.height() });
  }

  /**
   * Callback when selection size or position changes on given node

  * @param args callback arguments
   */
  private onSelectionChange(args: { x: number, y: number, width: number, height: number }) {
    // Convert values to block sizes
    const selectionSize: AreaSize = {
      x1: ContractUtils.convertToBlockSize(args.x),
      y1: ContractUtils.convertToBlockSize(args.y),
      x2: ContractUtils.convertToBlockSize(args.x + args.width),
      y2: ContractUtils.convertToBlockSize(args.y + args.height)
    }

    this.props.onSelectionSize(selectionSize);
  }

  /**
   * Adjust anchror size when scaling (keep the size constant)
   * 
   */
  private scaleAnchors() {
    const stage = this.anchors[topLeft].getStage()!;

    if (stage.scaleX() > SelectionRect.MAX_ANCHOR_SCALE_FACTOR) {
      return;
    }

    this.anchors[topLeft].setAttrs({
      scaleX: 1 / stage.scaleX(),
      scaleY: 1 / stage.scaleY()
    });

    this.anchors[topRight].setAttrs({
      scaleX: 1 / stage.scaleX(),
      scaleY: 1 / stage.scaleY()
    });

    this.anchors[bottomRight].setAttrs({
      scaleX: 1 / stage.scaleX(),
      scaleY: 1 / stage.scaleY()
    });

    this.anchors[bottomLeft].setAttrs({
      scaleX: 1 / stage.scaleX(),
      scaleY: 1 / stage.scaleY()
    });
  }

  /**
   * Called when size of selection changes
   * 
   * @param activeAnchor current anchor being resized
   */
  private updateSize(activeAnchor: Konva.Node) {
    const group = activeAnchor.getParent();

    const topLeftAnchor = this.anchors[topLeft];
    const topRightAnchor = this.anchors[topRight];
    const bottomRightAnchor = this.anchors[bottomRight];
    const bottomLeftAnchor = this.anchors[bottomLeft];

    const image = group.find('Image')[0] as Konva.Image;
    const rect = group.find('Rect')[0];

    const newX = Math.round(activeAnchor.x() / ContractUtils.BLOCKSIZE) * ContractUtils.BLOCKSIZE;
    const newY = Math.round(activeAnchor.y() / ContractUtils.BLOCKSIZE) * ContractUtils.BLOCKSIZE;

    // Snap to block size
    activeAnchor.x(newX);
    activeAnchor.y(newY);

    const anchorX = activeAnchor.x();
    const anchorY = activeAnchor.y();

    // Update anchor positions
    switch (activeAnchor.name()) {
      case 'topLeft':
        topRightAnchor.y(anchorY);
        bottomLeftAnchor.x(anchorX);
        break;
      case 'topRight':
        topLeftAnchor.y(anchorY);
        bottomRightAnchor.x(anchorX);
        break;
      case 'bottomRight':
        bottomLeftAnchor.y(anchorY);
        topRightAnchor.x(anchorX);
        break;
      case 'bottomLeft':
        bottomRightAnchor.y(anchorY);
        topLeftAnchor.x(anchorX);
        break;
    }

    // New selection size
    var width = topRightAnchor.x() - topLeftAnchor.x();
    var height = bottomLeftAnchor.y() - topLeftAnchor.y();

    // Reset position and size
    group.x(group.x() + topLeftAnchor.x());
    group.y(group.y() + topLeftAnchor.y());

    group.width(width);
    group.height(height);

    // Update underlying elements with correct position & size
    rect.x(0);
    rect.y(0);
    image.x(0);
    image.y(0);

    if (width && height) {
      image.width(width);
      image.height(height);

      rect.width(width);
      rect.height(height);
    }

    topLeftAnchor.x(0);
    topLeftAnchor.y(0);
    topRightAnchor.x(group.width());
    topRightAnchor.y(0);
    bottomRightAnchor.x(group.width());
    bottomRightAnchor.y(group.height());
    bottomLeftAnchor.x(0);
    bottomLeftAnchor.y(group.height());

    // Adjust anchor offsets if they start to overlap
    this.adjustAnchorOffset();

    // Callback on selection change
    this.onSelectionChange({ x: group.x() + rect.x(), y: group.y() + rect.y(), width: rect.width(), height: rect.height() });
  }

  /**
   * Adjusts anchor offsets in case they start overlapping
   */
  private adjustAnchorOffset() {
    const topLeftAnchor = this.anchors[topLeft];
    const topRightAnchor = this.anchors[topRight];
    const bottomRightAnchor = this.anchors[bottomRight];
    const bottomLeftAnchor = this.anchors[bottomLeft];

    // Initialize offsets to zero
    topLeftAnchor.offsetX(0);
    topLeftAnchor.offsetY(0);
    topRightAnchor.offsetX(0);
    topRightAnchor.offsetY(0);
    bottomRightAnchor.offsetX(0);
    bottomRightAnchor.offsetY(0);
    bottomLeftAnchor.offsetX(0);
    bottomLeftAnchor.offsetY(0);

    // Determine if radius overlap
    var radius = (topLeftAnchor as Konva.Circle).radius();
    const intersectionX = (topRightAnchor.x() - topLeftAnchor.x()) / topLeftAnchor.scaleX();
    const intersectionY = (bottomLeftAnchor.y() - topLeftAnchor.y()) / topLeftAnchor.scaleY();
    const intersection = Math.min(intersectionX, intersectionY);
    
    if (intersection < radius * 2) {
      // Adjust offsets
      radius = (radius / ContractUtils.BLOCKSIZE) * ContractUtils.BLOCKSIZE;
      topLeftAnchor.offsetX(radius);
      topLeftAnchor.offsetY(radius);

      topRightAnchor.offsetX(-radius);
      topRightAnchor.offsetY(radius);

      bottomLeftAnchor.offsetX(radius);
      bottomLeftAnchor.offsetY(-radius);

      bottomRightAnchor.offsetX(-radius);
      bottomRightAnchor.offsetY(-radius);
    }
  }

  /**
   * Bound anchors so they don't overlap
   * 
   * @param index anchor index
   * @param absolutePos current position
   * @returns bounded position
   */
  private boundAnchor(index: number, absolutePos: Vector2d): Vector2d {
    if (this.group == null) {
      return absolutePos;
    }

    var newX = absolutePos.x;
    var newY = absolutePos.y;

    const anchor = this.anchors[index];
    const stage = anchor.getStage()!;

    const pos = absolutePos;

    const minPadding = ContractUtils.BLOCKSIZE * stage.scaleX();

    // Ensure anchors don't overlap
    if (index === topLeft) {
      const maxPos = this.anchors[bottomRight].absolutePosition();
      newX = Math.min(pos.x, maxPos.x - minPadding);
      newY = Math.min(pos.y, maxPos.y - minPadding);
    } else if (index === topRight) {
      const maxPos = this.anchors[bottomLeft].absolutePosition();
      newX = Math.max(pos.x, maxPos.x + minPadding);
      newY = Math.min(pos.y, maxPos.y - minPadding);
    } else if (index === bottomLeft) {
      const maxPos = this.anchors[topRight].absolutePosition();
      newX = Math.min(pos.x, maxPos.x - minPadding);
      newY = Math.max(pos.y, maxPos.y + minPadding);
    } else {
      const maxPos = this.anchors[topLeft].absolutePosition();
      newX = Math.max(pos.x, maxPos.x + minPadding);
      newY = Math.max(pos.y, maxPos.y + minPadding);
    }

    // Bind to canvas
    const stageAbsPosition = stage.absolutePosition();
    newX = Math.max(newX, stageAbsPosition.x);
    newY = Math.max(newY, stageAbsPosition.y);

    newX = Math.min(newX, stageAbsPosition.x + ContractUtils.GRID_WIDTH_PIXELS * stage.scaleX());
    newY = Math.min(newY, stageAbsPosition.y + ContractUtils.GRID_HEIGHT_PIXELS * stage.scaleY());

    return { x: newX, y: newY }
  }

  private onAnchorDragMove(e: KonvaEventObject<DragEvent>) {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    this.resizing = true;
    this.updateSize(e.currentTarget);
    e.currentTarget.getLayer()!.draw();
  }

  private onAnchorMouseDown(e: KonvaEventObject<MouseEvent>) {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    e.currentTarget.moveToTop();
  }

  private onAnchorDragEnd(e: KonvaEventObject<DragEvent>) {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    this.resizing = false;
    this.props.onImageResize();
    e.currentTarget.getLayer()!.draw();
  }

  private onAnchorMouseOver(e: KonvaEventObject<MouseEvent>) {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    document.body.style.cursor = 'pointer';
    (e.currentTarget as Konva.Shape).strokeWidth(4);
    e.currentTarget.getLayer()!.draw();
  }

  private onAnchorMouseOut(e: KonvaEventObject<MouseEvent>) {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    document.body.style.cursor = 'default';
    (e.currentTarget as Konva.Shape).strokeWidth(1);
    e.currentTarget.getLayer()!.draw();
  }

  private onDragMove(e: KonvaEventObject<DragEvent>) {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    // Ignore drag if currently resizing
    if (this.resizing) {
      return;
    }

    const target = e.currentTarget;

    // Snap to block size
    target.position({
      x: Math.max(0, Math.round(target.x() / ContractUtils.BLOCKSIZE) * ContractUtils.BLOCKSIZE),
      y: Math.max(0, Math.round(target.y() / ContractUtils.BLOCKSIZE) * ContractUtils.BLOCKSIZE)
    });

    // Bind to boundary
    if (target.x() + target.width() > ContractUtils.GRID_WIDTH_PIXELS) {
      target.x(ContractUtils.GRID_WIDTH_PIXELS - target.width());
    }

    if (target.x() > ContractUtils.GRID_WIDTH_PIXELS) {
      target.x(ContractUtils.GRID_WIDTH_PIXELS);
    }

    if (target.y() + target.height() > ContractUtils.GRID_HEIGHT_PIXELS) {
      target.y(ContractUtils.GRID_HEIGHT_PIXELS - target.height());
    }

    if (target.y() > ContractUtils.GRID_HEIGHT_PIXELS) {
      target.y(ContractUtils.GRID_HEIGHT_PIXELS);
    }

    this.onSelectionChangeNode(e.currentTarget);
  }

  getRGBColor(): string {
    return (this.props.selectionData.isFree || this.props.selectionData.isOwned) ? "rgb(0, 161, 255)" : "rgb(255, 161, 0)";
  }

  render() {
    this.initX = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.x1);
    this.initY = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.y1);
    this.initWidth = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.x2) - this.initX;
    this.initHeight = ContractUtils.convertFromBlockSize(this.props.selectionData.selectionSize.y2) - this.initY;

    return (
      <Group
        name="group-name"
        x={this.initX}
        y={this.initY}
        width={this.initWidth}
        height={this.initHeight}
        draggable={true}
        onDragStart={() => { this.props.onStartDragSelection() } }
        onDragMove={(e) => this.onDragMove(e)}
        onDragEnd={() => { this.props.onStopDragSelection() } }
        ref={node => {
          if (null != node) {
            this.group = node;
          }
        }}
      >

        <Rect
          width={this.initWidth}
          height={this.initHeight}
          stroke={this.getRGBColor()}
          strokeWidth={1}
        />

        <Image
          width={this.initWidth}
          height={this.initHeight}
          image={this.image}
        />

        <Circle
          x={0}
          y={0}
          stroke={this.getRGBColor()}
          strokeWidth={1}
          fill="#fff"
          radius={8}
          name="topLeft"
          draggable={true}
          dragOnTop={false}
          dragBoundFunc={(pos: Vector2d) => this.boundAnchor(topLeft, pos)}
          onDragMove={this.onAnchorDragMove}
          onMouseDown={this.onAnchorMouseDown}
          onDragEnd={this.onAnchorDragEnd}
          onMouseOver={this.onAnchorMouseOver}
          onMouseOut={this.onAnchorMouseOut}
        />

        <Circle
          x={this.initWidth}
          y={0}
          stroke={this.getRGBColor()}
          strokeWidth={1}
          fill="#fff"
          radius={8}
          name="topRight"
          draggable={true}
          dragOnTop={false}
          dragBoundFunc={(pos: Vector2d) => this.boundAnchor(topRight, pos)}
          onDragMove={this.onAnchorDragMove}
          onMouseDown={this.onAnchorMouseDown}
          onDragEnd={this.onAnchorDragEnd}
          onMouseOver={this.onAnchorMouseOver}
          onMouseOut={this.onAnchorMouseOut}
        />

        <Circle
          x={0}
          y={this.initHeight}
          stroke={this.getRGBColor()}
          strokeWidth={1}
          fill="#fff"
          radius={8}
          name="bottomLeft"
          draggable={true}
          dragOnTop={false}
          dragBoundFunc={(pos: Vector2d) => this.boundAnchor(bottomLeft, pos)}
          onDragMove={this.onAnchorDragMove}
          onMouseDown={this.onAnchorMouseDown}
          onDragEnd={this.onAnchorDragEnd}
          onMouseOver={this.onAnchorMouseOver}
          onMouseOut={this.onAnchorMouseOut}
        />

        <Circle
          x={this.initWidth}
          y={this.initHeight}
          stroke={this.getRGBColor()}
          strokeWidth={1}
          fill="#fff"
          radius={8}
          name="bottomRight"
          draggable={true}
          dragOnTop={false}
          dragBoundFunc={(pos: Vector2d) => this.boundAnchor(bottomRight, pos)}
          onDragMove={this.onAnchorDragMove}
          onMouseDown={this.onAnchorMouseDown}
          onDragEnd={this.onAnchorDragEnd}
          onMouseOver={this.onAnchorMouseOver}
          onMouseOut={this.onAnchorMouseOut}
        />
      </Group>
    );
  }
}