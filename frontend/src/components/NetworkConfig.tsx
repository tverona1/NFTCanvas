export type NetworkParams = {
    chainId: string,
    chainName: string,
    nativeCurrency: {
        name: string,
        symbol: string,
        decimals: number
    },
    rpcUrls: string[],
    blockExplorerUrls: string[]
}

export const POLYGON_MAINNET_CONFIG: NetworkParams = {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
        name: 'Polygon',
        symbol: 'MATIC',
        decimals: 18
    },
    rpcUrls: ['https://rpc-mainnet.matic.network'],
    blockExplorerUrls: ['https://polygonscan.com/']
}

export const POLYGON_MUMBAI_CONFIG: NetworkParams = {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai',
    nativeCurrency: {
        name: 'Polygon',
        symbol: 'MATIC',
        decimals: 18
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerUrls: ['https://mumbai-explorer.matic.today']
}