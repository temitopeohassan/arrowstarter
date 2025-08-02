import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const log = (label: string, payload?: any) => {
  console.log(`[API] ${label}`, payload ?? "");
};

// 🔠 Types

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  ownerAddress: string;
  image: string;
  goal: number;
  raised: number;
  status: "draft" | "live" | "completed" | "cancelled" | "Delivered";
  creatorAddress: string;
  fundingGoal: number;
  totalBacked: number;
  backersCount: number;
  deadline?: string;
  deliverable?: {
    ipfsHash: string;
    ipfsUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    description: string;
    uploadedAt: any;
    uploadedBy: string;
  };
};

// 🔨 Project APIs

export async function createProject(data: Partial<Project>): Promise<Project> {
  try {
    log("Creating project", data);
    const response = await axios.post(`${API_BASE_URL}/api/projects`, data);
    log("Project created successfully", response.data);
    return response.data;
  } catch (error: any) {
    log("Error creating project", error.response?.data || error.message);
    throw error;
  }
}

export async function getAllProjects(category = "", search = ""): Promise<Project[]> {
  try {
    log("Fetching all projects", { category, search });
    const params = new URLSearchParams();
    if (category && category !== "all") params.append("category", category);
    if (search) params.append("search", search);

    const response = await axios.get(`${API_BASE_URL}/api/projects?${params.toString()}`);
    log("Projects fetched", response.data);
    return response.data;
  } catch (error: any) {
    log("Error fetching projects", error.response?.data || error.message);
    throw error;
  }
}

export async function getProjectById(id: string): Promise<Project> {
  try {
    log(`Fetching project by ID: ${id}`);
    const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`);
    log("Project fetched", response.data);
    return response.data;
  } catch (error: any) {
    log("Error fetching project by ID", error.response?.data || error.message);
    throw error;
  }
}

export async function getUserProjects(address: string): Promise<Project[]> {
  try {
    log(`Fetching user projects for address: ${address}`);
    const response = await axios.get(`${API_BASE_URL}/api/users/${address}/projects`);
    log("User projects fetched", response.data);
    return response.data;
  } catch (error: any) {
    log("Error fetching user projects", error.response?.data || error.message);
    throw error;
  }
}

export type BackedProject = Project & {
  backedAmount: number;
};

export async function getUserBackedProjects(address: string): Promise<BackedProject[]> {
  try {
    log(`Fetching backed projects for user: ${address}`);
    const response = await axios.get(`${API_BASE_URL}/api/users/${address}/backed-projects`);
    log("User backed projects fetched", response.data);
    return response.data;
  } catch (error: any) {
    log("Error fetching backed projects", error.response?.data || error.message);
    throw error;
  }
}

export async function getHeroFeaturedProjects(): Promise<Project[]> {
  try {
    log("Fetching hero featured projects");
    const response = await axios.get(`${API_BASE_URL}/api/hero-featured`);
    log("Hero featured projects fetched", response.data);
    return response.data;
  } catch (error: any) {
    log("Error fetching featured projects", error.response?.data || error.message);
    throw error;
  }
}

export async function backProject(
  projectId: string,
  data: { amount: number; backerAddress: string }
): Promise<{ success: boolean; message: string }> {
  try {
    log(`Backing project: ${projectId}`, data);
    const response = await axios.post(`${API_BASE_URL}/api/projects/${projectId}/back`, data);
    log("Project backed", response.data);
    return response.data;
  } catch (error: any) {
    log("Error backing project", error.response?.data || error.message);
    throw error;
  }
}

export async function requestProjectExtension(
  projectId: string,
  data: { extensionDays: number; reason?: string }
): Promise<{ success: boolean; message: string; newDeadline: string; extensionDays: number }> {
  try {
    log(`Requesting extension for project: ${projectId}`, data);
    const response = await axios.post(`${API_BASE_URL}/api/projects/${projectId}/extension`, data);
    log("Extension requested", response.data);
    return response.data;
  } catch (error: any) {
    log("Error requesting extension", error.response?.data || error.message);
    throw error;
  }
}

// 🪙 NFT Minting

export type MintRoughDraftNFTInput = {
  projectId: string;
  title: string;
  description: string;
  creatorAddress: string;
  image: File;
  metadata?: {
    name: string;
    description: string;
    image: string;
  };
};

export async function mintRoughDraftNFT(data: MintRoughDraftNFTInput): Promise<{ success: boolean; tokenId: string }> {
  try {
    log("Minting RoughDraftNFT", {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      creatorAddress: data.creatorAddress,
    });

    const formData = new FormData();
    formData.append("projectId", data.projectId);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("creatorAddress", data.creatorAddress);
    formData.append("image", data.image);

    const response = await axios.post(`${API_BASE_URL}/api/mint-create`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    log("RoughDraftNFT minted", response.data);
    return response.data;
  } catch (error: any) {
    log("Error minting RoughDraftNFT", error.response?.data || error.message);
    throw error;
  }
}


// 📁 File Upload

export async function uploadFile(file: File): Promise<{ url: string }> {
  try {
    log("Uploading file to IPFS", file);
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    log("File uploaded", response.data);
    return response.data;
  } catch (error: any) {
    log("Error uploading file", error.response?.data || error.message);
    throw error;
  }
}

export async function uploadDeliverable(
  projectId: string,
  file: File,
  description?: string
): Promise<{ success: boolean; message: string; ipfsHash: string; ipfsUrl: string; fileName: string }> {
  try {
    log(`Uploading deliverable for project: ${projectId}`, { fileName: file.name, size: file.size });
    
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }

    const response = await axios.post(`${API_BASE_URL}/api/projects/${projectId}/deliverable`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    log("Deliverable uploaded", response.data);
    return response.data;
  } catch (error: any) {
    log("Error uploading deliverable", error.response?.data || error.message);
    throw error;
  }
}
