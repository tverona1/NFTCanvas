import Konva from "konva";
import { KonvaEventObject } from "konva/types/Node";
import React, { RefObject } from "react";
import { Label, Layer, Line, Stage, Tag, Text } from "react-konva";
import AreaData from "./AreaData";
import ContractUtils from "./ContractUtils";
import AreaDataRect from "./AreaDataRect";
import SelectionRect from "./SelectionRect";
import SelectionData from "./SelectionData";
import AreaSize from "./AreaSize";
import ReactResizeDetector from 'react-resize-detector';
import { Vector2d } from "konva/types/types";

type Props = {
  // Canvas data that represents all the assets on the canvas
  canvasData: Map<string, AreaData>;

  // Current selection data
  selectionData: SelectionData;

  // Whether in purchase mode (i.e. wallet is connected)
  isPurchaseMode: boolean;

  // Wallet address (if wallet is connected)
  walletAddress?: string;

  // Callbacks
  onSelectionSize: (selectionSize: AreaSize) => void;
  onSelectedAreaData: (areaData: AreaData) => void;
  onImageResize: () => void;
  getIpfsImage: (ipfsUri: string) => Promise<Uint8Array | null>;
  isAreaOwned: (areaData: AreaData) => boolean;

  // Zoom slider (0-100)
  zoomPercent: number;
  onZoom: (zoomPercent: number) => void;
}

// Component state
type State = {
  stageWidth: number;
  stageHeight: number;
  largeContainerScaleX: number;
  largeContainerScaleY: number;
  cursorStyle: string;
  draggingSelection: boolean;
}

// Drag-to-scroll state
type DragToScrollState = {
  // Moust x & y position
  clientX: number;
  clientY: number;

  // Scroll top & left offsets
  scrollTop: number;
  scrollLeft: number;

  // Whether mouse is pressed
  isPressed: boolean;

  // Whether we're in drag-to-scroll mode
  isScrolling: boolean;

  // How much to drag before entering drag-to-scroll mode
  activationDistance: number;
}

/**
 * Canvas grid is the main canvas with grid, data data, selection area, etc.
 */
export default class CanvasGrid extends React.Component<Props, State> {
  // How much to zoom by
  static readonly SCALE_FACTOR = 1.1;

  // Max scale factor
  static readonly MAX_SCALE_FACTOR = 18;

  // Size padding to make scrolling smooth
  static readonly SCROLL_PADDING = 500;

  // Component State
  state: State;

  // Drag-to-scroll State
  dragToScrollState: DragToScrollState;

  // Touch state for pinch-to-zoom
  lastTouchCenter?: Vector2d = undefined;
  lastTouchDist = 0;

  width = window.innerWidth + CanvasGrid.SCROLL_PADDING;
  height = window.innerHeight + CanvasGrid.SCROLL_PADDING;

  // Scroll container Y position
  scrollContainerY = 0;

  // References to stage & containers
  stage?: Konva.Stage;
  scrollContainerRef?: RefObject<HTMLDivElement>;
  largeContainer?: HTMLElement
  label?: Konva.Label;
  labelText?: Konva.Text;
  labelLayer?: Konva.Layer;


  // Minimum zoom
  minZoom = 0;

  constructor(props: Props, state: State) {
    super(props);

    this.state = {
      stageWidth: window.innerWidth + CanvasGrid.SCROLL_PADDING, stageHeight: window.innerHeight + CanvasGrid.SCROLL_PADDING,
      largeContainerScaleX: 1, largeContainerScaleY: 1, cursorStyle: "auto", draggingSelection: false
    };
    this.dragToScrollState = { clientX: 0, clientY: 0, scrollTop: 0, scrollLeft: 0, isPressed: false, isScrolling: false, activationDistance: 10 };

    this.scrollContainerRef = React.createRef();

    this.onStartDragSelection = this.onStartDragSelection.bind(this);
    this.onStopDragSelection = this.onStopDragSelection.bind(this);
    this.onSelectedOwnedArea = this.onSelectedOwnedArea.bind(this);
  }

  componentDidMount() {
    if (null != this.scrollContainerRef?.current) {
      // Calculate scroll container's position
      this.scrollContainerY = this.getPosition(this.scrollContainerRef?.current).y;
    }

    // Fit stage into parent container
    this.minZoom = this.fitStageIntoParentContainer();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.zoomPercent !== this.props.zoomPercent && this.stage != null) {
      const scale = this.minZoom + this.props.zoomPercent / 100 * (CanvasGrid.MAX_SCALE_FACTOR - this.minZoom);
      this.setScale(scale);
    }
  }

  /**
   * Calculate an element's position
   * 
   * @param el HTML Element
   * @returns x, y position
   */
  private getPosition(el: HTMLElement): { x: Number, y: number } {
    var xPos = 0;
    var yPos = 0;

    while (el) {
      if (el.tagName === "BODY") {
        // Deal with browser quirks with body/window/document and page scroll
        var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
        var yScroll = el.scrollTop || document.documentElement.scrollTop;

        xPos += (el.offsetLeft - xScroll + el.clientLeft);
        yPos += (el.offsetTop - yScroll + el.clientTop);
      } else {
        // For all other non-BODY elements
        xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPos += (el.offsetTop - el.scrollTop + el.clientTop);
      }

      if (el.offsetParent == null) {
        break;
      }

      el = el.offsetParent as HTMLElement;
    }
    return {
      x: xPos,
      y: yPos
    };
  }

  /**
   * Compute scroll container height
   * 
   * @returns Scroll container height
   */
  private getScrollContainerHeight() {
    return window.innerHeight - this.scrollContainerY;
  }

  /**
   * Fit stage into parent container
   * 
   * @returns scale required to fit into parent
   */
  fitStageIntoParentContainer() {
    if (this.scrollContainerRef?.current != null && this.largeContainer != null) {
      // Compute scroll container vs larger container x & y scales
      const newScaleX = this.scrollContainerRef?.current.offsetWidth / this.largeContainer.offsetWidth;
      const newScaleY = (this.scrollContainerRef?.current.offsetHeight - this.scrollContainerY) / this.largeContainer.offsetHeight;

      // Scale is the min of both
      const newScale = Math.min(newScaleX, newScaleY);

      // Set scale to fit screen
      this.setScale(newScale);

      return newScale;
    }

    return 0;
  }

  /**
   * Zoom in / out
   */
  private zoom(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();

    if (this.stage == null) {
      return;
    }

    // Compute & set the scale
    const newScale = e.evt.deltaY < 0 ? this.stage.scaleX() * CanvasGrid.SCALE_FACTOR : this.stage.scaleX() / CanvasGrid.SCALE_FACTOR;
    this.setScale(newScale);
  }

  /**
   * Scale the canvas grid
   * 
   * @param scale The scale factor
   */
  private setScale(scale: number) {
    if (this.scrollContainerRef?.current == null || this.stage == null) {
      return;
    }

    const oldScale = this.stage.scaleX();

    // Limit zoom in
    if (scale > CanvasGrid.MAX_SCALE_FACTOR) {
      return;
    }

    // Limit zoom out
    if (scale < this.minZoom && scale < oldScale) {
      return;
    }

    this.setState({ largeContainerScaleX: scale, largeContainerScaleY: scale });
    this.stage.scale({ x: scale, y: scale });

    var zoomPercent;
    if (this.minZoom === 0) {
      zoomPercent = 0;
    } else {
      zoomPercent = (scale - this.minZoom) / (CanvasGrid.MAX_SCALE_FACTOR - this.minZoom) * 100;
    }
    this.props.onZoom(zoomPercent);
    this.stage.batchDraw();
  }

  /**
   * Callback for scrolling via scroll bars
   * 
   * @param e Scroll event
   */
  onScroll = (e: React.UIEvent<HTMLElement>) => {
    if (this.stage == null) {
      return;
    }

    var dx = e.currentTarget.scrollLeft - CanvasGrid.SCROLL_PADDING;
    var dy = e.currentTarget.scrollTop - CanvasGrid.SCROLL_PADDING;

    // Move stage container back to top-left position
    this.stage.container().style.transform =
      'translate(' + dx + 'px, ' + dy + 'px)';

    // Move stage to scroll offset
    this.stage.x(-dx);
    this.stage.y(-dy);

    this.stage.batchDraw();
  }

  /**
   * Callback when the scroll container is resized. Sets stage's width & height
   * 
   * @param width 
   * @param height 
   * @returns 
   */
  onResize = (width?: number, height?: number) => {
    if (this.stage == null) {
      return;
    }

    if (null != this.scrollContainerRef?.current) {
      // Set scroll container Y position
      const pos = this.getPosition(this.scrollContainerRef?.current);
      this.scrollContainerY = pos.y;
    }

    // Set stage width & height
    if (width != null) {
      this.width = width + CanvasGrid.SCROLL_PADDING;
    }

    if (height != null) {
      this.height = height + CanvasGrid.SCROLL_PADDING;
    }
  }

  /**
   * Indicates whether the scroll container is scrollable
   * 
   * @returns true if scrollable
   */
  isScrollable() {
    return this.scrollContainerRef?.current && ((this.scrollContainerRef?.current.scrollWidth > this.scrollContainerRef?.current.clientWidth) || (this.scrollContainerRef?.current.scrollHeight > this.scrollContainerRef?.current.clientHeight))
  }

  onStartDragSelection() {
    this.setState({ draggingSelection: true });
  }

  onStopDragSelection() {
    this.setState({ draggingSelection: false });
  }

  /**
   * Handle mouse down for drag to scroll
   * 
   * @param e MouseEvent
   */
  onMouseDown = (e: React.MouseEvent) => {
    if (!this.state.draggingSelection && this.scrollContainerRef?.current != null && this.isScrollable()) {
      e.preventDefault();

      this.dragToScrollState.scrollLeft = this.scrollContainerRef?.current.scrollLeft;
      this.dragToScrollState.scrollTop = this.scrollContainerRef?.current.scrollTop;
      this.dragToScrollState.clientX = e.clientX;
      this.dragToScrollState.clientY = e.clientY;
      this.dragToScrollState.isPressed = true;
    }
  };

  /**
   * Handle mouse up for drag to scroll
   * 
   * @param e MouseEvent
   */
  onMouseUp = (e: React.MouseEvent) => {
    if (this.dragToScrollState.isPressed) {
      e.preventDefault();
      if (this.dragToScrollState.isScrolling) {
        this.setState({ cursorStyle: "auto" });
      }
      this.dragToScrollState.isScrolling = false;
      this.dragToScrollState.isPressed = false;
      this.forceUpdate();
    }
  };

  /**
   * Handle mouse move for drag to scroll
   * 
   * @param e MouseEvent
   */
  onMouseMove = (e: React.MouseEvent) => {
    if (!this.state.draggingSelection && this.dragToScrollState.isPressed && this.scrollContainerRef?.current != null) {
      e.preventDefault();

      const newClientX = e.clientX;
      const newClientY = e.clientY;

      if (!this.dragToScrollState.isScrolling) {
        if ((Math.abs(newClientX - this.dragToScrollState.clientX) > this.dragToScrollState.activationDistance) || (Math.abs(newClientY - this.dragToScrollState.clientY) > this.dragToScrollState.activationDistance)) {
          this.dragToScrollState.clientX = newClientX;
          this.dragToScrollState.clientY = newClientY;
          this.dragToScrollState.isScrolling = true;
          this.setState({ cursorStyle: "grab" });
          this.forceUpdate();
        }
      } else {
        this.scrollContainerRef.current.scrollLeft -= newClientX - this.dragToScrollState.clientX;
        this.scrollContainerRef.current.scrollTop -= newClientY - this.dragToScrollState.clientY;
        this.dragToScrollState.clientX = newClientX
        this.dragToScrollState.clientY = newClientY
        this.dragToScrollState.scrollLeft = this.scrollContainerRef?.current.scrollLeft
        this.dragToScrollState.scrollTop = this.scrollContainerRef?.current.scrollTop
      }
    }
  };

  /**
   * Calculates distance between two points
   * 
   */
  private getDistance(p1: Vector2d, p2: Vector2d): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Calculates center point between two points
   */
  private getCenter(p1: Vector2d, p2: Vector2d): Vector2d {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  private onTouchMove = (e: React.TouchEvent) => {
    if (this.stage == null) {
      return;
    }

    if (e.touches.length < 2) {
      return;
    }

    var touch1 = e.touches[0];
    var touch2 = e.touches[1];

    if (touch1 && touch2) {
      e.preventDefault();

      // If the stage was under Konva's drag & drop
      // we need to stop it, and implement our own pan logic with two pointers
      if (this.stage.isDragging()) {
        this.stage.stopDrag();
      }

      var p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      };

      var p2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      };

      if (!this.lastTouchCenter) {
        this.lastTouchCenter = this.getCenter(p1, p2);
        return;
      }

      var dist = this.getDistance(p1, p2);
      if (!this.lastTouchDist) {
        this.lastTouchDist = dist;
      }

      var scale = this.stage.scaleX() * (dist / this.lastTouchDist);

      this.setScale(scale);
    }
  }

  private onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
  }

  private onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    this.lastTouchDist = 0;
    this.lastTouchCenter = undefined;
  }

  private onSelectedOwnedArea(areaData: AreaData) {
    this.props.onSelectedAreaData(areaData);
  }

  render() {
    const linesHoriz = [];
    const linesVert = [];

    // Draw the grid lines
    for (let i = 0; i <= ContractUtils.GRID_WIDTH_PIXELS / ContractUtils.BLOCKSIZE; i++) {
      linesVert.push(
        <Line
          key={i}
          strokeWidth={1}
          stroke={"#ccc"}
          points={[i * ContractUtils.BLOCKSIZE, 0, i * ContractUtils.BLOCKSIZE, ContractUtils.GRID_HEIGHT_PIXELS]}
        />
      );
    }

    for (let i = 0; i <= ContractUtils.GRID_HEIGHT_PIXELS / ContractUtils.BLOCKSIZE; i++) {
      linesHoriz.push(
        <Line
          key={i}
          strokeWidth={1}
          stroke={"#ccc"}
          points={[0, i * ContractUtils.BLOCKSIZE, ContractUtils.GRID_WIDTH_PIXELS, i * ContractUtils.BLOCKSIZE]}
        />
      );
    }

    // Add all the data entries
    const dataRects: JSX.Element[] = [];
    this.props.canvasData.forEach((value, key) => {
      dataRects.push(<AreaDataRect
        key={key} areaData={value} getIpfsImage={this.props.getIpfsImage} isOwned={this.props.isAreaOwned(value)} isDragging={this.dragToScrollState.isPressed} isPurchaseMode={this.props.isPurchaseMode} onSelectedOwnedArea={this.onSelectedOwnedArea}
        onMouseMove={(e: KonvaEventObject<MouseEvent>) => {
          if (this.stage != null && this.label != null && this.labelText != null && this.labelLayer != null) {
            const mousePos = this.stage.getPointerPosition()!;
            mousePos.x = mousePos.x - this.stage.x();
            mousePos.y = mousePos.y - this.stage.y();
            this.label.position({
              x: (mousePos!.x + 12) / this.stage.scaleX(),
              y: (mousePos!.y + 12) / this.stage.scaleY(),
            });
            this.label.scaleX(1 / this.stage.scaleX());
            this.label.scaleY(1 / this.stage.scaleY());
            this.labelText.text(value.metadata.name);
            this.label.show();
            this.labelLayer.batchDraw();
          }
        }}
        onMouseOut={(e: KonvaEventObject<MouseEvent>) => {
          if (this.label != null && this.labelLayer != null) {
            this.label.hide();
            this.labelLayer.draw();
          }
        }}
      />);
    });

    return (
      <div>
      <div id="scroll-container" style={{ width: "100%", height: this.getScrollContainerHeight(), overflow: "auto", cursor: this.state.cursorStyle }} onScroll={this.onScroll}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onTouchStart={this.onTouchStart}
        onTouchMove={this.onTouchMove}
        onTouchEnd={this.onTouchEnd}
        ref={this.scrollContainerRef}
      >
        <div id="large-container" style={{ width: ContractUtils.GRID_WIDTH_PIXELS * this.state.largeContainerScaleX, height: ContractUtils.GRID_HEIGHT_PIXELS * this.state.largeContainerScaleY, overflow: "hidden" }}>
          <div id="container" style={{ height: "100%", overflow: "hidden", margin: 0, padding: 0 }}
            ref={node => {
              if (null != node) {
                this.largeContainer = node;
              }
            }
            }>
            <Stage
              width={this.width}
              height={this.height}
              style={{ zIndex: 1 }}
              onWheel={(e) => {
                this.zoom(e);
              }}
              ref={node => {
                if (null != node) {
                  this.stage = node;
                }
              }}
            >
              <Layer listening={false}>
                {linesHoriz}
                {linesVert}
              </Layer>
              <Layer
                imageSmoothingEnabled={false}
              >
                {dataRects}
              </Layer>
              <Layer
                ref={node => {
                  if (null != node) {
                    this.labelLayer = node;
                  }
                }}>
                <Label
                  opacity={0.75}
                  visible={false}
                  ref={node => {
                    if (null != node) {
                      this.label = node;
                    }
                  }}>
                  <Tag
                    fill="white"
                  />
                  <Text
                    fontFamily="Calibri"
                    fontSize={16}
                    padding={2}
                    fill="black"
                    ref={node => {
                      if (null != node) {
                        this.labelText = node;
                      }
                    }}
                  />
                </Label>
              </Layer>
              {this.props.isPurchaseMode &&
                <Layer
                  imageSmoothingEnabled={false}
                >
                  <SelectionRect selectionData={this.props.selectionData} onSelectionSize={this.props.onSelectionSize} stageScale={this.stage?.scaleX()}
                    onImageResize={this.props.onImageResize} onStartDragSelection={this.onStartDragSelection} onStopDragSelection={this.onStopDragSelection} />
                </Layer>
              }
            </Stage>
          </div>
        </div>
      </div>
      <ReactResizeDetector handleWidth handleHeight targetRef={this.scrollContainerRef} onResize={this.onResize}/>
      </div>
    )
  }
}
