import { parseAbi } from "viem";

export const BRIDGE_MINTER_LENS_ABI = parseAbi([
  "function mintTo(address to, uint256 amount, bytes32 srcTxHash, uint256 srcChainId, uint256 srcNonce) external",
  "function burnToBsc(uint256 amount, address toOnBsc) external",
  "function pause() external",
  "function unpause() external",
  "function setFee(uint256 _feeBps, address _treasury) external",

  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) view returns (bool)",

  "function processed(uint256 srcChainId, bytes32 srcTxHash) view returns (bool)",
  "function feeBps() view returns (uint256)",
  "function treasury() view returns (address)",

  "event Minted(address indexed to, uint256 amount, bytes32 indexed srcTxHash, uint256 srcNonce)",
  "event Burned(address from, uint256 amount, address toOnBsc, uint256 nonce)"
]);
