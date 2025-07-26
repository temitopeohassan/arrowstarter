const API_BASE_URL = 'https://arrowstarter-backend.vercel.app/api';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  supporters: number;
  status: string;
  creatorAddress: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string;
  featured?: boolean;
  tokenId?: string;
  metadataUri?: string;
}

export interface Backing {
  projectId: string;
  backerAddress: string;
  amount: number;
  createdAt: Date;
}

export interface UploadResult {
  message: string;
  ipfsHash: string;
  fileUrl: string;
  filename: string;
  size: number;
  pinataUrl: string;
}

export interface CreateProjectResponse {
  id: string;
  message: string;
}

export interface ApiResponse {
  message: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Create a new project
export const createProject = async (
  projectData: Omit<Project, 'id' | 'raised' | 'supporters' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<CreateProjectResponse> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  return handleResponse(response);
};

// Mint RoughDraftNFT after project creation
export const mintRoughDraftNFT = async ({
  projectId,
  title,
  description,
  image,
  creatorAddress,
}: {
  projectId: string;
  title: string;
  description: string;
  image: string;
  creatorAddress: string;
}): Promise<{ tokenId: string; metadataUri: string }> => {
  const response = await fetch(`${API_BASE_URL}/mint-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, title, description, image, creatorAddress }),
  });
  return handleResponse(response);
};

// Get a list of projects (with optional filters)
export const getProjects = async (category?: string, search?: string): Promise<Project[]> => {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/projects?${params.toString()}`);
  return handleResponse(response);
};

// Get a single project by ID
export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);
  return handleResponse(response);
};

// Get featured projects
export const getFeaturedProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/hero-featured`);
  return handleResponse(response);
};

// Back a project
export const backProject = async (
  projectId: string,
  amount: number,
  backerAddress: string
): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/back`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, backerAddress }),
  });
  return handleResponse(response);
};

// Upload image file
export const uploadFile = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
};

// Get projects created by a user
export const getUserProjects = async (address: string): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/users/${address}/projects`);
  return handleResponse(response);
};

// Get projects backed by a user
export const getUserBackedProjects = async (address: string): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/users/${address}/backed-projects`);
  return handleResponse(response);
};
