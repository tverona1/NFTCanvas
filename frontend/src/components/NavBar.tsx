import React, { useState } from "react";
import { Badge, Button, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useHistory, useLocation } from "react-router-dom";
import ContractUtils from "./ContractUtils";
import PolygonLogo from "../resources/Polygon-Logo.svg";
import Welcome from "./Welcome";

type Props = {
  showConnectWallet: boolean;
  connectWallet: () => void;

  // Zoom slider (0-100)
  zoomPercent: number;
  onZoom: (zoomPercent: number) => void;

  totalPixelsSold: number;
  priceUSMicros: number;
}

export default function AppNavBar(props: Props) {
  const onZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onZoom(event.currentTarget.valueAsNumber);
  }

  const [showDropDown, setShowDropDown] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const location = useLocation();
  const history = useHistory();

  function navigateToFAQ() {
    setShowWelcome(false);
    history.push("/faq");
  }

  function navigateToDapp() {
    history.push("/");
  }

  function formatNumPixels(n: number): string {
    return n.toLocaleString('en-US');
  }

  function toNextTier(): number {
    if (props.totalPixelsSold < 259200) {
      return 259200 - props.totalPixelsSold;
    } else if (props.totalPixelsSold < 518400) {
      return 518400 - props.totalPixelsSold;
    } else if (props.totalPixelsSold < 1036800) {
      return 1036800 - props.totalPixelsSold;
    } else if (props.totalPixelsSold < 2073600) {
      return 2073600 - props.totalPixelsSold;
    } else if (props.totalPixelsSold < 4147200) {
      return 4147200 - props.totalPixelsSold;
    } else {
      return 8294400 - props.totalPixelsSold;
    }
  }

  function formatPrice(priceUSMicros: number): string {
    var tier = "6th";
    switch (priceUSMicros) {
      case 10:
        tier = "1st"
        break;
      case 100:
        tier = "2nd";
        break;
      case 1000:
        tier = "3rd";
        break;
      case 10000:
        tier = "4th";
        break;
      case 100000:
        tier = "5th";
        break;
    }
    return `$${(priceUSMicros / 1000000).toString()} (${tier} tier)`;
  }

  return (
    <>
      <Welcome
        show={showWelcome}
        onHide={() => { setShowWelcome(false) }}
        onShowFAQ={navigateToFAQ}
      />
      <Navbar expand="lg">
        <LinkContainer to="/">
          <Navbar.Brand>
            <div>
              <div>
                <h2 style={{ marginBottom: "0rem" }}>The NFT Canvas Project</h2>
                <small style={{ display: "flex", justifyContent: "flex-end" }}>on <img src={PolygonLogo} alt="Polygon" style={{ maxWidth: "25%", height: "auto" }} /></small>
              </div>
              <h6>Own your piece of NFT history!</h6>
            </div>
          </Navbar.Brand>
        </LinkContainer>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto" activeKey={location.pathname}>
            <NavDropdown title="About" id="basic-nav-dropdown" style={{ marginTop: "auto", marginBottom: "auto", paddingRight: "1rem" }}
              show={showDropDown}
              onMouseEnter={(e) => setShowDropDown(true)}
              onMouseLeave={(e) => setShowDropDown(false)}
              onTouchEnd={(e) => setTimeout(() => { setShowDropDown(!showDropDown) }, 200)}>
              <NavDropdown.Item onClick={() => setShowWelcome(true)}>Welcome</NavDropdown.Item>
              <LinkContainer to="/faq">
                <NavDropdown.Item>FAQ</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/tos">
                <NavDropdown.Item>Terms {"&"} Conditions</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
            {location.pathname !== '/' &&
              <Nav.Link
                style={{ paddingRight: "1rem" }}>
                <Button
                  style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", whiteSpace: "nowrap" }}
                  variant="warning"
                  onClick={navigateToDapp}
                >
                  Get Started
                </Button>
              </Nav.Link>
            }
            {location.pathname === '/' && props.showConnectWallet &&
              <Nav.Link
                style={{ paddingRight: "1rem" }}>
                <Button
                  style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", whiteSpace: "nowrap" }}
                  variant="warning"
                  onClick={props.connectWallet}
                >
                  Connect Wallet
                </Button>
              </Nav.Link>
            }
            {location.pathname === '/' &&
              <Nav.Link
                style={{ paddingRight: "1rem" }}>
                <Badge variant="secondary" style={{ lineHeight: 1.5 }}>
                  <b>Sold:</b> {formatNumPixels(props.totalPixelsSold)}<br />
                  <b>Remaining:</b> {formatNumPixels(ContractUtils.GRID_WIDTH_PIXELS * ContractUtils.GRID_HEIGHT_PIXELS - props.totalPixelsSold)}
                </Badge>
              </Nav.Link>
            }
            {location.pathname === '/' &&
              <Nav.Link
                style={{ paddingRight: "1rem" }}>
                <Badge variant="light" style={{ lineHeight: 1.5 }}>
                  <b>Current price:</b> {formatPrice(props.priceUSMicros)}<br />
                  <b>Next tier in:</b> {formatNumPixels(toNextTier())}
                </Badge>
              </Nav.Link>
            }
          </Nav>
          {location.pathname === '/' &&
            <Form inline>
              <Form.Group controlId="formZoom">
                <Form.Label>Zoom</Form.Label>
                <Form.Control type="range" value={props.zoomPercent} onChange={onZoomChange}></Form.Control>
              </Form.Group>
            </Form>
          }
        </Navbar.Collapse>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
      </Navbar>
    </>
  )
}
