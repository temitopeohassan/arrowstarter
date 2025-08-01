"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Download, FileText, Calendar, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { uploadDeliverable } from "@/lib/api";

interface ManageBackedProjectModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  project: {
    id: string;
    title: string;
    goal: number;
    raised: number;
    status: string;
    creatorAddress: string;
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
  onSuccess?: () => void;
}

export function ManageBackedProjectModal({
  isOpen,
  onCloseAction,
  project,
  onSuccess,
}: ManageBackedProjectModalProps) {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isCreator = address === project.creatorAddress;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File size too large. Maximum size is 50MB.");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      await uploadDeliverable(project.id, selectedFile, description);
      
      setSuccessMessage("Deliverable uploaded successfully!");
      setSelectedFile(null);
      setDescription("");
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after delay
      setTimeout(() => {
        onCloseAction();
        setSuccessMessage("");
      }, 3000);

    } catch (err: any) {
      console.error("Error uploading deliverable:", err);
      setError(err.message || "Failed to upload deliverable. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setDescription("");
      setError("");
      setSuccessMessage("");
      onCloseAction();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manage Project: {project.title}
          </DialogTitle>
          <DialogDescription>
            {isCreator ? "Upload deliverables for your project" : "View project deliverables"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Project Status</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                project.status === "Delivered" ? "bg-green-100 text-green-800" :
                project.status === "Funding Open" ? "bg-blue-100 text-blue-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {project.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Goal:</span>
                <span className="ml-2 font-medium">{project.goal} ETH</span>
              </div>
              <div>
                <span className="text-muted-foreground">Raised:</span>
                <span className="ml-2 font-medium">{project.raised} ETH</span>
              </div>
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <span className="ml-2 font-medium">
                  {Math.round((project.raised / project.goal) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Creator:</span>
                <span className="ml-2 font-medium">
                  {project.creatorAddress.slice(0, 6)}...{project.creatorAddress.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Section (Only for creator) */}
          {isCreator && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Deliverable</h3>
              
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  accept="*/*"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 50MB. All file types supported.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you're uploading..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  rows={3}
                />
              </div>

              {selectedFile && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Deliverable
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Deliverable Section */}
          {project.deliverable && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Deliverable</h3>
              
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{project.deliverable.fileName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(project.deliverable.fileSize)}
                  </span>
                </div>

                {project.deliverable.description && (
                  <p className="text-sm text-muted-foreground">
                    {project.deliverable.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Uploaded: {formatDate(project.deliverable.uploadedAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>By: {project.deliverable.uploadedBy.slice(0, 6)}...{project.deliverable.uploadedBy.slice(-4)}</span>
                </div>

                <Button
                  onClick={() => window.open(project.deliverable!.ipfsUrl, '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Deliverable
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 border border-green-200">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 