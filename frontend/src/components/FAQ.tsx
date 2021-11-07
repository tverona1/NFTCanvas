import { Accordion, Card, Button, Col, Container, Row, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTwitter,
    faGithub,
    faDiscord
} from "@fortawesome/free-brands-svg-icons";

export default function FAQ() {
    const tabs = [
        { id: "1", label: "What is the NFT Canvas Project?", description: (<div>
            <p>This site is an experiment at minting NTFs to cover a full 4K (3840 x 2160 pixels) screen. It is inspired by the classic 2005 <a href="http://www.milliondollarhomepage.com/" target="_blank" rel="noopener noreferrer">Million Dollar Homepage</a> project but using modern, decentralized blockchain technology.</p>
            <p>How it works:</p>
            <ul>
                <li>Pick an area to buy.</li>
                <li>Put your own image and link on it for everyone to see.</li>
                <li>Your area is minted as an NFT and lives on the Polygon blockchain forever!</li>
                <li>Also, everything here is decentralized and enforced by a smart contract.</li>
            </ul>
            <p>The minted NFTs are browsable / tradable at the OpenSea market <a href="https://opensea.io/collection/nft-canvas-2" target="_blank" rel="noopener noreferrer">here</a>.</p>
            <p>It's open source too. Check it out on <a href="https://github.com/tverona1/NFTCanvas" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
            </div>) },
        { id: "2", label: "How much is a pixel?", description: (<div><p>Prices start at 0.001 cents per pixel, so get in early! The minimum size that can be purchased is 10 x 10 pixels.</p><p><b>Price tiers:</b></p><p>0 - 250K pixels: $0.00001</p><p>250K - 500K pixels: $0.0001</p><p>500K - 1M pixels: $0.001</p><p>1M - 2M pixels: $0.01</p><p>2M - 4M pixels: $0.10</p><p>4M - 8M pixels: $1.00</p></div>) },
        { id: "3", label: "Why Polygon?", description: (<div><p>Short answer, because Polygon is <a href="https://awesomepolygon.com/" target="_blank" rel="noopener noreferrer">awesome</a>!</p><p><a href="https://polygon.technology/" target="_blank" rel="noopener noreferrer">Polygon</a> is "Ethereum's Internet of Blockchains". It allows building &amp; connecting Ethereum-compatible blockchain networks. Plus, it's super fast and gas prices are very cheap compared to Ethereum. Without cheap gas prices, a project like this (where an NFT costs at little as a few cents) would not be viable.</p></div>) },
        { id: "4", label: "Where can I get some Polygon (MATIC)?", description: (<p>Polygon is readily available on a wide variety of major exchanges, including Coinbase, Binance and Bittrex. It can also be acquired via decentralized exchanges like Uniswap.</p>) },
        { id: "5", label: "How do I connect my wallet?", description: (<div><p>Just hit the Connect Wallet button. If this is your first time connecting to Polygon, it will ask you to confirm switching to the Polygon network.</p><p>If this doesn't work for you, you can manually add Polygon to Metamask by following the instructions <a href="https://docs.matic.network/docs/develop/metamask/config-matic/" target="_blank" rel="noopener noreferrer">here</a>.</p><p>If you need help setting up your Metamask wallet, see instructions <a href="https://docs.matic.network/docs/develop/metamask/hello/" target="_blank" rel="noopener noreferrer">here</a>.</p></div>) },
        { id: "6", label: "How do I buy an area?", description: (<p>Connect your <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> wallet, pick the size and location of the area, choose your own image, title and link and hit buy.</p>) },
        { id: "7", label: "What do I get when I buy an area?", description: (<p>When you buy an area, you own it! It's an NFT on the Polygon blockchain. You get to put an image and link for everyone to see.</p>) },
        { id: "8", label: "Once I buy an area, do I own it?", description: (<p>Yes! The area is minted as an NFT (ERC-721 token) that you own.</p>) },
        { id: "9", label: "What if I want to change it later?", description: (<p>No problem! Connect your wallet, pick your area and update its image, title and/or link. You only pay the transaction gas fee to update.</p>) },
        { id: "10", label: "Can I trade or sell my area?", description: (<p>Yes! Because the area you buy is an NFT, you can trade or sell it on any NFT market, like OpenSea. In fact, you can check out the minted NTFs over at OpenSea <a href="https://opensea.io/collection/nft-canvas-2" target="_blank" rel="noopener noreferrer">here</a>.</p>) },
        { id: "11", label: "Can someone cover up my area?", description: (<p>Nope - the area that you buy is exclusively yours and no one can cover it up. This is enforced by the smart contract.</p>) },
        { id: "12", label: "Does this work on mobile?", description: (<p>Yes! To connect your wallet on mobile, open this site in the <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> or <a href="https://trustwallet.com/" target="_blank" rel="noopener noreferrer">Trust Wallet</a> apps.</p>) },
        { id: "13", label: "How long will this be up?", description: (<p>Everything on this site is completely decentralized, so effectively forever! The NFTs live on the blockchain and metadata is pinned on IPFS (InterPlanetary File System).</p>) },
        { id: "14", label: "Where is the data stored?", description: (<p>The data for your area (image, title and link) is uploaded to IPFS. The NFT itself lives on the blockchain.</p>) },
        { id: "15", label: "Can I see the contract?", description: (<p>You bet! It's <a href="https://polygonscan.com/address/0x8076Eb069b7B0D480dBAdc800B9806F9a947f6A5#code" target="_blank" rel="noopener noreferrer">here</a>.</p>) },
        { id: "16", label: "How is the dollar price converted to Polygon (MATIC)?", description: (<p>The dollar price is converted to Polygon (MATIC) using <a href="https://data.chain.link/" target="_blank" rel="noopener noreferrer">Chainlink</a>'s on-chain MATIC/USD price feed. See the contract implementation.</p>) },
        { id: "17", label: "What's an NFT?", description: (<p>An NFT stands for Non-fungible Token. An NFT is a one-of-a-kind, verifiable digital asset. It implements the <a href="https://eips.ethereum.org/EIPS/eip-721" target="_blank" rel="noopener noreferrer">ERC-721 standard</a>. In this case, each area is an NFT.</p>) },
        { id: "18", label: "What's a Dapp?", description: (<div><p>Dapp stands for decentralized application. This site is a Dapp, meaning it's completely decentralized. It is comprised of:</p>
                <ul><li>A contract that lives on the Polygon blockchain</li>
                    <li>NTFs that are minted when areas are bought and which also live on the blockchain</li>
                    <li>The NTF's metadata (title, link and image) that lives on <a href="https://ipfs.io/" target="_blank" rel="noopener noreferrer">IPFS</a>, a decentralized global shared file system</li>
                    <li>This site itself, which also lives on IPFS</li>
                </ul>
            </div>) },
        { id: "19", label: "Can I upload anything?", description: (<p>You're free to upload any title, image and link. However, please do not upload illegal, harmful or offensive content. Note that the NFT metadata resides on IPFS and inapproprite content may be removed by IPFS providers at their discretion.</p>) },
        { id: "20", label: "Who are you?", description: (
            <div>
            <p>Hi, my name is Tomer. I'm a professional software engineer by day and I enjoy creating projects like these as a hobby. Drop me a note anytime!</p>
                <a href="https://github.com/tverona1/NFTCanvas"  target="_blank" rel="noopener noreferrer" className="github social">
                    <FontAwesomeIcon icon={faGithub} size="2x" />
                </a>
                <a href="https://twitter.com/tverona"  target="_blank" rel="noopener noreferrer" className="twitter social">
                    <FontAwesomeIcon icon={faTwitter} size="2x" />
                </a>
                <a href="https://discord.gg/budumafhck"  target="_blank" rel="noopener noreferrer" className="dicord social">
                    <FontAwesomeIcon icon={faDiscord} size="2x" />
                </a>
            </div>
            ) },
        { id: "21", label: "Is this open source?", description: (<p>Yes it is - check it out on <a href="https://github.com/tverona1/NFTCanvas" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>) },
        ];

    return (
        <Container className="faq-section">
        <Row className="align-items-center my-5">
            <Col className="lg-7">
            <Row>
                <Col className="col-md-10 faq-title text-center pb-3">
                        <h1 className="font-weight-light">Frequently Asked Questions</h1>
            </Col>
            </Row>
            <Row>
                <Col className="col-md-10">
                    {tabs.map(tab => (
                        <Accordion key={tab.id} className="faq">
                            <Card>
                                <Card.Header>
                                    <Accordion.Toggle as={Button} variant="link" eventKey={tab.id} className="faq-title">
                                        <Badge pill variant="light">{tab.id}</Badge>
                                        {tab.label}
                                    </Accordion.Toggle>
                                </Card.Header>
                                <Accordion.Collapse eventKey={tab.id}>
                                    <Card.Body>{tab.description}</Card.Body>
                                </Accordion.Collapse>
                            </Card>
                        </Accordion>
                    ))}
                </Col>
            </Row>
            </Col>
        </Row>
    </Container>
    );
}
