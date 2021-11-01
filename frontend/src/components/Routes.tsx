import React from 'react';
import { useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import Dapp from './Dapp';
import FAQ from './FAQ';
import AppNavBar from './NavBar';
import TOS from './TOS';

export const Routes = () => {
    const [showConnectWallet, setShowConnectWallet] = useState(true);
    const [connectWallet, setConnectWallet] = useState(() => () => {});
    const [zoomPercent, setZoomPercent] = useState(0);
    const [onZoom, setOnZoom] = useState(() => (zoomPercent: number) => {});
    const [totalPixelsSold, setTotalPixelsSold] = useState(0);
    const [priceUSMicros, setPriceUSMicros] = useState(1);

    return (
        <div>
            <AppNavBar showConnectWallet={showConnectWallet} connectWallet={connectWallet} zoomPercent={zoomPercent} onZoom={onZoom} totalPixelsSold={totalPixelsSold} priceUSMicros={priceUSMicros}/>
            <Switch>
            <Route exact path="/" render={
                props => (<Dapp {...props} setShowConnectWallet={setShowConnectWallet} setConnectWallet={setConnectWallet} setZoomPercent={setZoomPercent} setOnZoom={setOnZoom} setTotalPixelsSold={setTotalPixelsSold} setPriceUSMicros={setPriceUSMicros}></Dapp>)
            }
            />
            <Route path="/faq" component={FAQ} />
            <Route path="/tos" component={TOS} />
            </Switch>
        </div>
    )
}
