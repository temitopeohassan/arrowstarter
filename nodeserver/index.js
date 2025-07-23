const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { PinataSDK } = require("pinata-web3");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = {
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
};

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://arrowstarter.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Root
app.get("/", (req, res) => {
  res.send("<h1>🚀 Arrow Starter Backend API Server</h1>");
});

// ✅ Create Project (Updated to include image)
app.post("/api/projects", async (req, res) => {
  try {
    const { title, description, category, goal, creatorAddress, image, featured = false } = req.body;

    const docRef = await db.collection("projects").add({
      title,
      description,
      category,
      goal,
      creatorAddress,
      image: image || "", // Add image field
      raised: 0,
      supporters: 0,
      status: "Funding Open",
      featured: featured, // Fixed syntax error
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ id: docRef.id, message: "Project created successfully" });
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get All Projects (optionally filtered)
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
  } catch (error) {
    console.error("Get Projects Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get Hero Featured (latest project only)
app.get("/api/hero-featured", async (req, res) => {
  try {
    const snapshot = await db
      .collection("projects")
      .where("featured", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No featured projects found" });
    }

    const featuredProjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(featuredProjects);
  } catch (error) {
    console.error("Hero Featured Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get Single Project
app.get("/api/projects/:id", async (req, res) => {
  try {
    const doc = await db.collection("projects").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Project not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get Project Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Back a Project
app.post("/api/projects/:id/back", async (req, res) => {
  const { amount, backerAddress } = req.body;
  const projectRef = db.collection("projects").doc(req.params.id);

  try {
    await db.runTransaction(async (transaction) => {
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
  } catch (error) {
    console.error("Back Project Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Upload File to IPFS via Pinata
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
      message: "File uploaded successfully to IPFS via Pinata",
      ipfsHash,
      fileUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      filename: req.file.originalname,
      size: req.file.size,
      pinataUrl: `https://app.pinata.cloud/pinmanager?hash=${ipfsHash}`,
    });
  } catch (error) {
    console.error("Pinata Upload Error:", error);
    res.status(500).json({ error: "Failed to upload file to IPFS via Pinata" });
  }
});

// ✅ Get User's Created Projects
app.get("/api/users/:address/projects", async (req, res) => {
  try {
    const snapshot = await db
      .collection("projects")
      .where("creatorAddress", "==", req.params.address)
      .get();

    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(projects);
  } catch (error) {
    console.error("User Projects Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get Backed Projects by User
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
  } catch (error) {
    console.error("Backed Projects Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});