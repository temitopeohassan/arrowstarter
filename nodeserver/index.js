// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { PinataSDK } = require("pinata-web3");
const { mintRoughDraftNFTHandler } = require("./src/routes/mintRoughDraftNFT");

dotenv.config();

console.log("🔧 Initializing server...");
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 🔐 Firebase Admin Initialization
if (!getApps().length) {
  console.log("🔐 Initializing Firebase Admin SDK");
  initializeApp({
    credential: cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    }),
  });
}

const db = getFirestore();

// 🔧 Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://arrowstarter.vercel.app",
  ],
  credentials: true,
}));
app.use(express.json());

// 🧪 Health check
app.get("/", (_, res) => {
  console.log("✅ GET /");
  res.send("<h1>🚀 Arrow Starter Backend API</h1>");
});

app.post("/api/projects", async (req, res) => {
  console.log("📨 POST /api/projects", req.body);
  try {
    const {
      title,
      description,
      category,
      goal,
      creatorAddress,
      image = "",
      featured = false,
    } = req.body;

    // Create project in Firebase
    const docRef = await db.collection("projects").add({
      title,
      description,
      category,
      goal,
      creatorAddress,
      image,
      raised: 0,
      supporters: 0,
      status: "Funding Open",
      featured,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create project mapping for smart contract integration
    const projectId = docRef.id;
    await db.collection("projectMappings").doc(projectId).set({
      firebaseId: projectId,
      contractId: null, // Will be set when project is created on smart contract
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ 
      id: docRef.id, 
      message: "Project created successfully" 
    });
  } catch (err) {
    console.error("❌ Create Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/projects", async (req, res) => {
  console.log("📨 GET /api/projects", req.query);
  try {
    const { category, search } = req.query;
    let query = db.collection("projects");
    if (category && category !== "all") query = query.where("category", "==", category);

    const snapshot = await query.get();
    const projects = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!search || data.title.toLowerCase().includes(search.toLowerCase()) || data.description.toLowerCase().includes(search.toLowerCase())) {
        projects.push({ id: doc.id, ...data });
      }
    });

    res.json(projects);
  } catch (err) {
    console.error("❌ Get Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/hero-featured", async (_, res) => {
  console.log("📨 GET /api/hero-featured");
  try {
    const snapshot = await db.collection("projects").where("featured", "==", true).orderBy("createdAt", "desc").get();
    if (snapshot.empty) return res.status(404).json({ error: "No featured projects found" });

    const featured = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(featured);
  } catch (err) {
    console.error("❌ Hero Featured Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/projects/:id", async (req, res) => {
  console.log("📨 GET /api/projects/:id", req.params);
  try {
    const doc = await db.collection("projects").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Project not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("❌ Get Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/:id/back", async (req, res) => {
  console.log("📨 POST /api/projects/:id/back", req.params, req.body);
  const { amount, backerAddress } = req.body;
  const projectRef = db.collection("projects").doc(req.params.id);

  try {
    await db.runTransaction(async transaction => {
      const doc = await transaction.get(projectRef);
      if (!doc.exists) throw new Error("Project not found");

      const data = doc.data();
      transaction.update(projectRef, {
        raised: data.raised + amount,
        supporters: data.supporters + 1,
        updatedAt: new Date(),
      });

      const backingRef = db.collection("backings").doc();
      transaction.set(backingRef, {
        projectId: req.params.id,
        backerAddress,
        amount,
        createdAt: new Date(),
      });
    });

    res.json({ message: "Project backed successfully" });
  } catch (err) {
    console.error("❌ Back Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/:id/extension", async (req, res) => {
  console.log("📨 POST /api/projects/:id/extension", req.params, req.body);
  try {
    const { extensionDays, reason } = req.body;
    
    if (!extensionDays || extensionDays <= 0) {
      return res.status(400).json({ error: "Extension days must be greater than 0" });
    }

    const projectRef = db.collection("projects").doc(req.params.id);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();
    
    // Handle the current deadline - use createdAt if deadline doesn't exist
    let currentDeadline;
    if (projectData.deadline) {
      // If deadline is a Firestore Timestamp, convert to Date
      if (projectData.deadline.toDate) {
        currentDeadline = projectData.deadline.toDate();
      } else {
        currentDeadline = new Date(projectData.deadline);
      }
    } else {
      // Use createdAt as the base deadline
      if (projectData.createdAt.toDate) {
        currentDeadline = projectData.createdAt.toDate();
      } else {
        currentDeadline = new Date(projectData.createdAt);
      }
    }
    
    const newDeadline = new Date(currentDeadline.getTime() + (extensionDays * 24 * 60 * 60 * 1000));

    // Update the project with new deadline and extension info
    await projectRef.update({
      deadline: Timestamp.fromDate(newDeadline),
      extensionRequested: true,
      extensionDays: extensionDays,
      extensionReason: reason || "",
      extensionRequestedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    res.json({ 
      message: "Extension requested successfully",
      newDeadline: newDeadline,
      extensionDays: extensionDays
    });
  } catch (err) {
    console.error("❌ Request Extension Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log("📨 POST /api/upload", req.file);
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });
    const result = await pinata.upload.file(file);
    const ipfsHash = result.IpfsHash;

    res.json({
      message: "File uploaded to IPFS",
      ipfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      filename: req.file.originalname,
      size: req.file.size,
      pinataUrl: `https://app.pinata.cloud/pinmanager?hash=${ipfsHash}`,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/api/projects/:id/deliverable", upload.single("file"), async (req, res) => {
  console.log("📨 POST /api/projects/:id/deliverable", req.params);
  try {
    const { projectId } = req.params;
    const { description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return res.status(400).json({ error: "File size too large. Maximum size is 50MB." });
    }

    // Get project details
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectData = projectDoc.data();

    // Upload file to IPFS via Pinata
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
    });

    const options = {
      pinataMetadata: {
        name: `${projectData.title} - Deliverable`,
        keyvalues: {
          projectId: projectId,
          projectTitle: projectData.title,
          uploadedAt: new Date().toISOString(),
          description: description || "",
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.uploadFile(file.buffer, options);
    const ipfsHash = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // Store deliverable info in project
    await projectRef.update({
      deliverable: {
        ipfsHash: ipfsHash,
        ipfsUrl: ipfsUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: description || "",
        uploadedAt: Timestamp.now(),
        uploadedBy: projectData.creatorAddress,
      },
      status: "Delivered",
      updatedAt: Timestamp.now(),
    });

    res.json({ 
      message: "Deliverable uploaded successfully",
      ipfsHash: ipfsHash,
      ipfsUrl: ipfsUrl,
      fileName: file.originalname,
    });

  } catch (err) {
    console.error("❌ Upload Deliverable Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:address/projects", async (req, res) => {
  console.log("📨 GET /api/users/:address/projects", req.params);
  try {
    const snapshot = await db.collection("projects").where("creatorAddress", "==", req.params.address).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(projects);
  } catch (err) {
    console.error("❌ User Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:address/backed-projects", async (req, res) => {
  console.log("📨 GET /api/users/:address/backed-projects", req.params);
  try {
    const snapshot = await db.collection("backings").where("backerAddress", "==", req.params.address).get();
    const backedProjects = [];

    for (const doc of snapshot.docs) {
      const backing = doc.data();
      const projectDoc = await db.collection("projects").doc(backing.projectId).get();
      if (projectDoc.exists) {
        backedProjects.push({ id: projectDoc.id, ...projectDoc.data(), backedAmount: backing.amount });
      }
    }

    res.json(backedProjects);
  } catch (err) {
    console.error("❌ Backed Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🪙 NFT Mint Route
app.post("/api/mint-create", ...mintRoughDraftNFTHandler);

// Get project mapping for smart contract integration
app.get("/api/projects/:id/mapping", async (req, res) => {
  console.log("📨 GET /api/projects/:id/mapping", req.params);
  try {
    const { id } = req.params;
    const doc = await db.collection("projectMappings").doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Project mapping not found" });
    }
    
    const mappingData = doc.data();
    res.json({
      firebaseId: mappingData.firebaseId,
      contractId: mappingData.contractId,
    });
  } catch (err) {
    console.error("❌ Get Project Mapping Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update project mapping with smart contract ID
app.put("/api/projects/:id/mapping", async (req, res) => {
  console.log("📨 PUT /api/projects/:id/mapping", req.params, req.body);
  try {
    const { id } = req.params;
    const { contractId } = req.body;
    
    if (!contractId) {
      return res.status(400).json({ error: "Contract ID is required" });
    }
    
    await db.collection("projectMappings").doc(id).get().update({
      contractId: contractId,
      updatedAt: new Date(),
    });
    
    res.json({ 
      message: "Project mapping updated successfully",
      firebaseId: id,
      contractId: contractId,
    });
  } catch (err) {
    console.error("❌ Update Project Mapping Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
