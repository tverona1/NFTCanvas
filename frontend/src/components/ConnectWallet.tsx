import React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { ErrorToast } from "./ToastMessage";

type Props = {
  networkError?: string,
  connectWallet: () => void,
  dismiss: () => void
}

export default class ConnectWallet extends React.Component<Props> {
  render() {
    return (
      <Container>
        <Row className="justify-content-md-center">
          {this.props.networkError && (
            <ErrorToast
              message={this.props.networkError}
              onClose={this.props.dismiss}
            />
          )}
          <Col xs={6} className="p-4 text-center">
            <p>Please connect to your wallet.</p>
            <Button
              variant="warning"
              onClick={this.props.connectWallet}
            >
              Connect Wallet
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
}

/*
          <Col xs={12} className="text-center">
            {// Metamask network should be set to Localhost:8545
            }
            {this.props.networkError && errorToast(this.props.networkError) (
              <ErrorMessage
                message={this.props.networkError}
                dismiss={this.props.dismiss}
              />
            )}
          </Col>
*/