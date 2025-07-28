// API Configuration
export const BACK_END_API = 'https://arrowstarter-backend.vercel.app/';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Smart Contract Addresses
export const CROWDFUNDING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const ROUGH_DRAFT_NFT_ADDRESS = process.env.NEXT_PUBLIC_ROUGH_DRAFT_NFT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// Wagmi Configuration
export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your_wallet_connect_project_id_here'; 