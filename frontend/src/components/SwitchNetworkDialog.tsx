import { Button, Modal } from "react-bootstrap"

type Props = {
  show: boolean,
  networkName: string,
  onClose: () => void,
  onSwitch: () => void
}

export default function SwitchNetworkDialog(props: Props) {
  return (
    <Modal show={props.show} animation={false} aria-labelledby="contained-modal-title-vcenter" centered onHide={props.onClose}>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Connect Wallet to Network
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please connect wallet to {props.networkName}</p>
      </Modal.Body>
      <Modal.Footer>
      <Button
          variant="warning"
          onClick={props.onSwitch}
        >
          Switch to {props.networkName}
        </Button>

      </Modal.Footer>
    </Modal>
  );
}
