/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { ERC721 } from "../ERC721";

export class ERC721__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    name_: string,
    symbol_: string,
    overrides?: Overrides
  ): Promise<ERC721> {
    return super.deploy(name_, symbol_, overrides || {}) as Promise<ERC721>;
  }
  getDeployTransaction(
    name_: string,
    symbol_: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(name_, symbol_, overrides || {});
  }
  attach(address: string): ERC721 {
    return super.attach(address) as ERC721;
  }
  connect(signer: Signer): ERC721__factory {
    return super.connect(signer) as ERC721__factory;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): ERC721 {
    return new Contract(address, _abi, signerOrProvider) as ERC721;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "tokenByIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162001cbb38038062001cbb833981810160405260408110156200003757600080fd5b81019080805160405193929190846401000000008211156200005857600080fd5b9083019060208201858111156200006e57600080fd5b82516401000000008111828201881017156200008957600080fd5b82525081516020918201929091019080838360005b83811015620000b85781810151838201526020016200009e565b50505050905090810190601f168015620000e65780820380516001836020036101000a031916815260200191505b50604052602001805160405193929190846401000000008211156200010a57600080fd5b9083019060208201858111156200012057600080fd5b82516401000000008111828201881017156200013b57600080fd5b82525081516020918201929091019080838360005b838110156200016a57818101518382015260200162000150565b50505050905090810190601f168015620001985780820380516001836020036101000a031916815260200191505b5060405250620001b391506301ffc9a760e01b90506200021d565b8151620001c8906006906020850190620002a2565b508051620001de906007906020840190620002a2565b50620001f16380ac58cd60e01b6200021d565b62000203635b5e139f60e01b6200021d565b6200021563780e9d6360e01b6200021d565b50506200033e565b6001600160e01b031980821614156200027d576040805162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e7465726661636520696400000000604482015290519081900360640190fd5b6001600160e01b0319166000908152602081905260409020805460ff19166001179055565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10620002e557805160ff191683800117855562000315565b8280016001018555821562000315579182015b8281111562000315578251825591602001919060010190620002f8565b506200032392915062000327565b5090565b5b8082111562000323576000815560010162000328565b61196d806200034e6000396000f3fe608060405234801561001057600080fd5b50600436106100eb5760003560e01c80634f6ccce7116100925780634f6ccce7146102c15780636352211e146102de5780636c0360eb146102fb57806370a082311461030357806395d89b4114610329578063a22cb46514610331578063b88d4fde1461035f578063c87b56dd14610423578063e985e9c514610440576100eb565b806301ffc9a7146100f057806306fdde031461012b578063081812fc146101a8578063095ea7b3146101e157806318160ddd1461020f57806323b872dd146102295780632f745c591461025f57806342842e0e1461028b575b600080fd5b6101176004803603602081101561010657600080fd5b50356001600160e01b03191661046e565b604080519115158252519081900360200190f35b610133610491565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561016d578181015183820152602001610155565b50505050905090810190601f16801561019a5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101c5600480360360208110156101be57600080fd5b5035610527565b604080516001600160a01b039092168252519081900360200190f35b61020d600480360360408110156101f757600080fd5b506001600160a01b038135169060200135610589565b005b610217610664565b60408051918252519081900360200190f35b61020d6004803603606081101561023f57600080fd5b506001600160a01b03813581169160208101359091169060400135610675565b6102176004803603604081101561027557600080fd5b506001600160a01b0381351690602001356106cc565b61020d600480360360608110156102a157600080fd5b506001600160a01b038135811691602081013590911690604001356106f7565b610217600480360360208110156102d757600080fd5b5035610712565b6101c5600480360360208110156102f457600080fd5b5035610728565b610133610750565b6102176004803603602081101561031957600080fd5b50356001600160a01b03166107b1565b610133610819565b61020d6004803603604081101561034757600080fd5b506001600160a01b038135169060200135151561087a565b61020d6004803603608081101561037557600080fd5b6001600160a01b03823581169260208101359091169160408201359190810190608081016060820135600160201b8111156103af57600080fd5b8201836020820111156103c157600080fd5b803590602001918460018302840111600160201b831117156103e257600080fd5b91908080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525092955061097b945050505050565b6101336004803603602081101561043957600080fd5b50356109d9565b6101176004803603604081101561045657600080fd5b506001600160a01b0381358116916020013516610c5c565b6001600160e01b0319811660009081526020819052604090205460ff165b919050565b60068054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561051d5780601f106104f25761010080835404028352916020019161051d565b820191906000526020600020905b81548152906001019060200180831161050057829003601f168201915b5050505050905090565b600061053282610c8a565b61056d5760405162461bcd60e51b815260040180806020018281038252602c815260200180611862602c913960400191505060405180910390fd5b506000908152600460205260409020546001600160a01b031690565b600061059482610728565b9050806001600160a01b0316836001600160a01b031614156105e75760405162461bcd60e51b81526004018080602001828103825260218152602001806118e66021913960400191505060405180910390fd5b806001600160a01b03166105f9610c97565b6001600160a01b0316148061061a575061061a81610615610c97565b610c5c565b6106555760405162461bcd60e51b81526004018080602001828103825260388152602001806117b56038913960400191505060405180910390fd5b61065f8383610c9b565b505050565b60006106706002610d09565b905090565b610686610680610c97565b82610d14565b6106c15760405162461bcd60e51b81526004018080602001828103825260318152602001806119076031913960400191505060405180910390fd5b61065f838383610db8565b6001600160a01b03821660009081526001602052604081206106ee9083610f04565b90505b92915050565b61065f8383836040518060200160405280600081525061097b565b600080610720600284610f10565b509392505050565b60006106f1826040518060600160405280602981526020016118176029913960029190610f2c565b60098054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561051d5780601f106104f25761010080835404028352916020019161051d565b60006001600160a01b0382166107f85760405162461bcd60e51b815260040180806020018281038252602a8152602001806117ed602a913960400191505060405180910390fd5b6001600160a01b03821660009081526001602052604090206106f190610d09565b60078054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561051d5780601f106104f25761010080835404028352916020019161051d565b610882610c97565b6001600160a01b0316826001600160a01b031614156108e4576040805162461bcd60e51b815260206004820152601960248201527822a9219b99189d1030b8383937bb32903a379031b0b63632b960391b604482015290519081900360640190fd5b80600560006108f1610c97565b6001600160a01b03908116825260208083019390935260409182016000908120918716808252919093529120805460ff191692151592909217909155610935610c97565b6001600160a01b03167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b61098c610986610c97565b83610d14565b6109c75760405162461bcd60e51b81526004018080602001828103825260318152602001806119076031913960400191505060405180910390fd5b6109d384848484610f43565b50505050565b60606109e482610c8a565b610a1f5760405162461bcd60e51b815260040180806020018281038252602f8152602001806118b7602f913960400191505060405180910390fd5b60008281526008602090815260409182902080548351601f6002600019610100600186161502019093169290920491820184900484028101840190945280845260609392830182828015610ab45780601f10610a8957610100808354040283529160200191610ab4565b820191906000526020600020905b815481529060010190602001808311610a9757829003601f168201915b505050505090506060610ac5610750565b9050805160001415610ad95750905061048c565b815115610b9a5780826040516020018083805190602001908083835b60208310610b145780518252601f199092019160209182019101610af5565b51815160209384036101000a600019018019909216911617905285519190930192850191508083835b60208310610b5c5780518252601f199092019160209182019101610b3d565b6001836020036101000a038019825116818451168082178552505050505050905001925050506040516020818303038152906040529250505061048c565b80610ba485610f95565b6040516020018083805190602001908083835b60208310610bd65780518252601f199092019160209182019101610bb7565b51815160209384036101000a600019018019909216911617905285519190930192850191508083835b60208310610c1e5780518252601f199092019160209182019101610bff565b6001836020036101000a0380198251168184511680821785525050505050509050019250505060405160208183030381529060405292505050919050565b6001600160a01b03918216600090815260056020908152604080832093909416825291909152205460ff1690565b60006106f1600283611070565b3390565b600081815260046020526040902080546001600160a01b0319166001600160a01b0384169081179091558190610cd082610728565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60006106f18261107c565b6000610d1f82610c8a565b610d5a5760405162461bcd60e51b815260040180806020018281038252602c815260200180611789602c913960400191505060405180910390fd5b6000610d6583610728565b9050806001600160a01b0316846001600160a01b03161480610da05750836001600160a01b0316610d9584610527565b6001600160a01b0316145b80610db05750610db08185610c5c565b949350505050565b826001600160a01b0316610dcb82610728565b6001600160a01b031614610e105760405162461bcd60e51b815260040180806020018281038252602981526020018061188e6029913960400191505060405180910390fd5b6001600160a01b038216610e555760405162461bcd60e51b81526004018080602001828103825260248152602001806117656024913960400191505060405180910390fd5b610e6083838361065f565b610e6b600082610c9b565b6001600160a01b0383166000908152600160205260409020610e8d9082611080565b506001600160a01b0382166000908152600160205260409020610eb0908261108c565b50610ebd60028284611098565b5080826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b60006106ee83836110ae565b6000808080610f1f8686611112565b9097909650945050505050565b6000610f3984848461118d565b90505b9392505050565b610f4e848484610db8565b610f5a84848484611257565b6109d35760405162461bcd60e51b81526004018080602001828103825260328152602001806117336032913960400191505060405180910390fd5b606081610fba57506040805180820190915260018152600360fc1b602082015261048c565b8160005b8115610fd257600101600a82049150610fbe565b60608167ffffffffffffffff81118015610feb57600080fd5b506040519080825280601f01601f191660200182016040528015611016576020820181803683370190505b50859350905060001982015b831561106757600a840660300160f81b8282806001900393508151811061104557fe5b60200101906001600160f81b031916908160001a905350600a84049350611022565b50949350505050565b60006106ee83836113bf565b5490565b60006106ee83836113d7565b60006106ee838361149d565b6000610f3984846001600160a01b0385166114e7565b815460009082106110f05760405162461bcd60e51b81526004018080602001828103825260228152602001806117116022913960400191505060405180910390fd5b8260000182815481106110ff57fe5b9060005260206000200154905092915050565b8154600090819083106111565760405162461bcd60e51b81526004018080602001828103825260228152602001806118406022913960400191505060405180910390fd5b600084600001848154811061116757fe5b906000526020600020906002020190508060000154816001015492509250509250929050565b600082815260018401602052604081205482816112285760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156111ed5781810151838201526020016111d5565b50505050905090810190601f16801561121a5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5084600001600182038154811061123b57fe5b9060005260206000209060020201600101549150509392505050565b600061126b846001600160a01b031661157e565b61127757506001610db0565b6060611385630a85bd0160e11b61128c610c97565b88878760405160240180856001600160a01b03168152602001846001600160a01b0316815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b838110156112f35781810151838201526020016112db565b50505050905090810190601f1680156113205780820380516001836020036101000a031916815260200191505b5095505050505050604051602081830303815290604052906001600160e01b0319166020820180516001600160e01b038381831617835250505050604051806060016040528060328152602001611733603291396001600160a01b0388169190611584565b9050600081806020019051602081101561139e57600080fd5b50516001600160e01b031916630a85bd0160e11b1492505050949350505050565b60009081526001919091016020526040902054151590565b60008181526001830160205260408120548015611493578354600019808301919081019060009087908390811061140a57fe5b906000526020600020015490508087600001848154811061142757fe5b60009182526020808320909101929092558281526001898101909252604090209084019055865487908061145757fe5b600190038181906000526020600020016000905590558660010160008781526020019081526020016000206000905560019450505050506106f1565b60009150506106f1565b60006114a983836113bf565b6114df575081546001818101845560008481526020808220909301849055845484825282860190935260409020919091556106f1565b5060006106f1565b60008281526001840160205260408120548061154c575050604080518082018252838152602080820184815286546001818101895560008981528481209551600290930290950191825591519082015586548684528188019092529290912055610f3c565b8285600001600183038154811061155f57fe5b9060005260206000209060020201600101819055506000915050610f3c565b3b151590565b6060610f398484600085856115988561157e565b6115e9576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b60006060866001600160a01b031685876040518082805190602001908083835b602083106116285780518252601f199092019160209182019101611609565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d806000811461168a576040519150601f19603f3d011682016040523d82523d6000602084013e61168f565b606091505b509150915061169f8282866116aa565b979650505050505050565b606083156116b9575081610f3c565b8251156116c95782518084602001fd5b60405162461bcd60e51b81526020600482018181528451602484015284518593919283926044019190850190808383600083156111ed5781810151838201526020016111d556fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e64734552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e7465724552433732313a207472616e7366657220746f20746865207a65726f20616464726573734552433732313a206f70657261746f7220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e456e756d657261626c654d61703a20696e646578206f7574206f6620626f756e64734552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a207472616e73666572206f6620746f6b656e2074686174206973206e6f74206f776e4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76616c20746f2063757272656e74206f776e65724552433732313a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564a26469706673582212209536109d7af8dd903b2a4582503dfbbae66d80be8881fe99ad271a1766772ffb64736f6c63430007030033";