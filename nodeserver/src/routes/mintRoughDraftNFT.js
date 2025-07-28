const { ethers } = require("ethers");
const PinataSDK = require("@pinata/sdk");
const multer = require("multer");
const { Readable } = require("stream");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
require("dotenv").config();

// Dynamic service account setup using env variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Initialize Firebase
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// Load ABI and contract address
const { abi: ROUGHDRAFT_NFT_ABI } = require("../abis/RoughDraftNFT.json");
const ROUGHDRAFT_NFT_ADDRESS = process.env.ROUGHDRAFT_NFT_ADDRESS;

// Pinata and ethers setup
const pinata = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const roughDraftNFT = new ethers.Contract(ROUGHDRAFT_NFT_ADDRESS, ROUGHDRAFT_NFT_ABI, wallet);

// Multer for image upload
const upload = multer({ storage: multer.memoryStorage() });

const mintRoughDraftNFTHandler = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { projectId, title, description, creatorAddress } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const imageBuffer = req.file.buffer;
      const imageStream = Readable.from(imageBuffer);

      // Upload image to IPFS
      let imageResponse;
      try {
        imageResponse = await pinata.pinFileToIPFS(imageStream, {
          pinataMetadata: { name: "project-image" },
        });
      } catch (err) {
        console.error("Pinata image upload failed:", err);
        return res.status(500).json({ error: "Failed to upload image to IPFS" });
      }

      const imageURI = `ipfs://${imageResponse.IpfsHash}`;

      // Upload metadata to IPFS
      const metadata = {
        name: title,
        description,
        image: imageURI,
      };

      let metadataResponse;
      try {
        metadataResponse = await pinata.pinJSONToIPFS(metadata, {
          pinataMetadata: { name: "project-metadata" },
        });
      } catch (err) {
        console.error("Pinata metadata upload failed:", err);
        return res.status(500).json({ error: "Failed to upload metadata to IPFS" });
      }

      const tokenBaseURI = `ipfs://${metadataResponse.IpfsHash}`;

      // Set base URI (optional)
      try {
        const tx = await roughDraftNFT.setBaseURI(tokenBaseURI + "/");
        await tx.wait();
      } catch (err) {
        console.warn("Base URI set might have failed or already set:", err.reason || err.message);
      }

      // Mint NFT
      const tx = await roughDraftNFT.mint(creatorAddress);
      const receipt = await tx.wait();

      const mintEvent = receipt.logs.find(
        (log) => log.topics[0] === roughDraftNFT.interface.getEventTopic("DraftMinted")
      );
      const tokenId = mintEvent
        ? ethers.getBigInt(mintEvent.topics[2]).toString()
        : "unknown";

      const tokenURI = `${tokenBaseURI}/${tokenId}`;

      // Verify project exists and update with NFT data
      const projectRef = db.collection("projects").doc(projectId);
      const projectDoc = await projectRef.get();
      
      if (!projectDoc.exists) {
        return res.status(404).json({ error: "Project not found" });
      }

      await projectRef.update({
        tokenId,
        tokenURI,
        imageURI,
        nftMinted: true,
        nftMintedAt: new Date().toISOString(),
      });

      res.status(201).json({ message: "NFT minted and saved", tokenId, tokenURI });
    } catch (error) {
      console.error("Mint NFT Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
];

module.exports = { mintRoughDraftNFTHandler };
