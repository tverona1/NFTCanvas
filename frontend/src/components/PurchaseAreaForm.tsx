import React from "react";
import ContractUtils from "./ContractUtils";
import SelectionData from "./SelectionData";
import AreaSize from "./AreaSize";
import { Button, CloseButton, Container, Form, Spinner } from "react-bootstrap";
import Draggable from 'react-draggable';
import { RefObject } from "react";

type Props = {
    currentSelection: SelectionData;
    txInProgress: boolean;
    calculatePrice: (selectionSize: AreaSize) => number;
    onPurchase: () => void;
    onUpdate: () => void;
    onSelection: (selectionData: SelectionData) => void;
    onCancel: () => void;
    onImageResize: () => void;
}

/**
 * Purchase area form
 */
export default class PurchaseAreaForm extends React.Component<Props> {
    containerRef: RefObject<HTMLDivElement> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.handleURIInputChange = this.handleURIInputChange.bind(this);
        this.handleX1InputChange = this.handleX1InputChange.bind(this);
        this.handleX2InputChange = this.handleX2InputChange.bind(this);
        this.handleY1InputChange = this.handleY1InputChange.bind(this);
        this.handleY2InputChange = this.handleY2InputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.calculatePrice = this.calculatePrice.bind(this);
    }

    /**
     * Callback when selection is updated
     * 
     * @param args - selection parameters
     */
    updateSelection(args: { uri?: string, name?: string, description?: string, image?: File, x1?: number, x2?: number, y1?: number, y2?: number }) {
        // If given property is not updated, go with existing value
        const uri = args.uri ?? this.props.currentSelection.uri;
        const name = args.name ?? this.props.currentSelection.name;
        const description = args.description ?? this.props.currentSelection.description;
        const resizedImageURL = this.props.currentSelection.resizedImageURL;
        const imageIpfsURL = this.props.currentSelection.imageIpfsURL;
        const isOwned = this.props.currentSelection.isOwned;
        const isFree = this.props.currentSelection.isFree;

        var imageFile = this.props.currentSelection.imageFile;
        if (args.image != null) {
            imageFile = args.image;
        }

        var x1 = this.props.currentSelection.selectionSize.x1;
        var x2 = this.props.currentSelection.selectionSize.x2;
        var y1 = this.props.currentSelection.selectionSize.y1;
        var y2 = this.props.currentSelection.selectionSize.y2;

        // Convert coordinates back to block sizes
        if (args.x1 != null) {
            x1 = ContractUtils.convertToBlockSize(args.x1);
        }
        if (args.x2 != null) {
            x2 = ContractUtils.convertToBlockSize(args.x2);
        }
        if (args.y1 != null) {
            y1 = ContractUtils.convertToBlockSize(args.y1);
        }
        if (args.y2 != null) {
            y2 = ContractUtils.convertToBlockSize(args.y2);
        }

        // Callback on selection change
        this.props.onSelection({ uri: uri, name: name, description: description, imageFile: imageFile, resizedImageURL: resizedImageURL, imageIpfsURL: imageIpfsURL, selectionSize: { x1: x1, x2: x2, y1: y1, y2: y2 }, isOwned: isOwned, isFree: isFree });
    }

    handleX1InputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ x1: parseInt(event.currentTarget.value) });
    }

    handleX2InputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ x2: parseInt(event.currentTarget.value) });
    }

    handleY1InputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ y1: parseInt(event.currentTarget.value) });
    }

    handleY2InputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ y2: parseInt(event.currentTarget.value) });
    }

    handleURIInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ uri: event.currentTarget.value });
    }

    handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ name: event.currentTarget.value });
    }

    handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ description: event.currentTarget.value });
    }

    handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.updateSelection({ image: event.currentTarget.files?.[0] });
    }

    /**
     * Callback on submit
     * 
     * @param event Form event
     */
    handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (this.props.currentSelection.isOwned) {
            this.props.onUpdate();
        } else {
            this.props.onPurchase();
        }
    }

    disableSubmitButton(): boolean {
        return this.props.txInProgress || (!this.props.currentSelection.isFree && !this.props.currentSelection.isOwned) ? true : false;
    }

    getFormTitle(): string {
        if (this.props.currentSelection.isOwned) {
            return "Update Area";
        } else if (!this.props.currentSelection.isFree) {
            return "Purchase Area (Unavailable)";
        } else {
            return "Purchase Area";
        }
    }

    getSubmitText(): string {
        return this.props.currentSelection.isOwned ? "Update" : "Buy";
    }

    getSubmittingText(): string {
        return this.props.currentSelection.isOwned ? "Updating" : "Buying";
    }

    calculatePrice(): number {
        return this.props.currentSelection.isOwned ? 0 : this.props.calculatePrice(this.props.currentSelection.selectionSize);
    }

    render() {
        const width = ContractUtils.convertFromBlockSize(this.props.currentSelection.selectionSize.x2 - this.props.currentSelection.selectionSize.x1);
        const height = ContractUtils.convertFromBlockSize(this.props.currentSelection.selectionSize.y2 - this.props.currentSelection.selectionSize.y1);
        const position = `${ContractUtils.convertFromBlockSize(this.props.currentSelection.selectionSize.x1)}, ${ContractUtils.convertFromBlockSize(this.props.currentSelection.selectionSize.y1)}`;

        return (
            <Draggable bounds="parent" cancel=".form-control, .form-file, .btn" nodeRef={this.containerRef} >
                <Container style={{ position: "fixed", right: 0, bottom: 0, paddingBottom: 8, width: "20%", minWidth: "175px", backgroundColor: "#eee", cursor: "move" }}
                    ref={this.containerRef}>
                    <CloseButton onClick={this.props.onCancel} />
                    <div>
                        <h4>{this.getFormTitle()}</h4>
                        <div>Area: {width} x {height}</div>
                        <div>Position: {position}</div>
                        <div>Price: ${this.calculatePrice()} (+ gas)</div>
                        <Form onSubmit={this.handleSubmit}>
                            <Form.Group>
                                <Form.Label>Title</Form.Label>
                                <Form.Control type="text" name="name" value={this.props.currentSelection.name} onChange={this.handleNameChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>URL</Form.Label>
                                <Form.Control type="text" name="uri" autoCorrect="false" autoCapitalize="none" placeholder="https://www.example.com" pattern="(([hH][tT][tT][pP][sS]?):\/\/)[^\s/$.?#].[^\s]*" title="Must start with http:// or https://"
                                    value={this.props.currentSelection.uri} onChange={this.handleURIInputChange} required />
                            </Form.Group>
                            <Form.Group>
                                <Form.File label="Select Image" accept=".tif,.jpg,.jpeg,.gif,.png" onChange={this.handleFileSelected} />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={this.disableSubmitButton()}>
                                {this.props.txInProgress &&
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                }
                                {this.props.txInProgress &&
                                    <span> {this.getSubmittingText()}</span>}
                                {!this.props.txInProgress &&
                                    this.getSubmitText()}
                            </Button>
                        </Form>
                    </div>
                </Container>
            </Draggable>
        )
    }
}
