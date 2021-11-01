import { Button, Modal } from "react-bootstrap";

type Props = {
    onHide: () => void;
    onShowFAQ: () => void;
    show: boolean;
}

export default function Welcome(props: Props) {
    return (
      <Modal
        show={props.show}
        onHide={props.onHide}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        animation={false}
        centered>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Welcome to the NFT Canvas Project!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>This site is an experiment at minting NTFs to cover a full 4K (3840 x 2160 pixels) screen.</p>
            <p>How it works:</p>
            <ul>
            <li>Pick an area to buy.</li>
                <li>Put your own image and link on it for everyone to see.</li>
                <li>Your area is minted as an NFT and lives on the Polygon blockchain forever!</li>
                <li>Everything here is decentralized and enforced by a smart contract.</li>
            </ul>
            <p>To get started, connect your wallet.</p>
            <p>To learn more, see the <a href="/faq" onClick={(e) => {e.preventDefault(); props.onShowFAQ()}}>FAQ</a>.</p>
            <img src={"/Screenshot.png"} alt="Screenshot" style={{ maxWidth: "100%", height: "auto" }}></img>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Get Started</Button>
        </Modal.Footer>
      </Modal>
    );
  }