// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { PinataSDK } = require("pinata-web3");
const { mintRoughDraftNFTHandler } = require("./src/routes/mintRoughDraftNFT");

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 🔐 Firebase Admin Initialization (guarded)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
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
  res.send("<h1>🚀 Arrow Starter Backend API</h1>");
});

// 🚀 Create a new project
app.post("/api/projects", async (req, res) => {
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

    res.status(201).json({ id: docRef.id, message: "Project created successfully" });
  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📄 Get all or filtered projects
app.get("/api/projects", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = db.collection("projects");

    if (category && category !== "all") {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    const projects = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        !search ||
        data.title.toLowerCase().includes(search.toLowerCase()) ||
        data.description.toLowerCase().includes(search.toLowerCase())
      ) {
        projects.push({ id: doc.id, ...data });
      }
    });

    res.json(projects);
  } catch (err) {
    console.error("Get Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Get featured project(s) for hero section
app.get("/api/hero-featured", async (_, res) => {
  try {
    const snapshot = await db
      .collection("projects")
      .where("featured", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No featured projects found" });
    }

    const featured = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(featured);
  } catch (err) {
    console.error("Hero Featured Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📄 Get single project by ID
app.get("/api/projects/:id", async (req, res) => {
  try {
    const doc = await db.collection("projects").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Project not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Get Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 💰 Back a project
app.post("/api/projects/:id/back", async (req, res) => {
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
    console.error("Back Project Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📦 Upload image to IPFS via Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const result = await pinata.upload.file(file);
    const ipfsHash = result.IpfsHash;

    res.json({
      message: "File uploaded to IPFS",
      ipfsHash,
      fileUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      filename: req.file.originalname,
      size: req.file.size,
      pinataUrl: `https://app.pinata.cloud/pinmanager?hash=${ipfsHash}`,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 👤 Get projects created by a user
app.get("/api/users/:address/projects", async (req, res) => {
  try {
    const snapshot = await db
      .collection("projects")
      .where("creatorAddress", "==", req.params.address)
      .get();

    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(projects);
  } catch (err) {
    console.error("User Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 👥 Get projects backed by a user
app.get("/api/users/:address/backed-projects", async (req, res) => {
  try {
    const snapshot = await db
      .collection("backings")
      .where("backerAddress", "==", req.params.address)
      .get();

    const backedProjects = [];

    for (const doc of snapshot.docs) {
      const backing = doc.data();
      const projectDoc = await db.collection("projects").doc(backing.projectId).get();
      if (projectDoc.exists) {
        backedProjects.push({
          id: projectDoc.id,
          ...projectDoc.data(),
          backedAmount: backing.amount,
        });
      }
    }

    res.json(backedProjects);
  } catch (err) {
    console.error("Backed Projects Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🪙 Mint Rough Draft NFT
app.post("/api/mint-create", mintRoughDraftNFTHandler);

// 🚀 Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
