"use client";

import { useState } from "react";
import { X, Upload, ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import { createProject, uploadFile } from "@/lib/api";
import { useProjectRefresh } from "@/context/ProjectRefreshContext";

interface CreateProjectFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateProjectForm({ onClose, onSuccess }: CreateProjectFormProps) {
  const { address } = useAccount();
  const { triggerRefresh } = useProjectRefresh(); // ✅ use context

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const isLoading = isUploading || isCreating;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setImage(file);
      setError("");

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!image) {
      setError("Please select a cover image");
      return;
    }

    try {
      setError("");
      setIsUploading(true);

      const uploadResult = await uploadFile(image);
      setIsUploading(false);
      setIsCreating(true);

      await createProject({
        title,
        description,
        category,
        goal: parseFloat(goal),
        creatorAddress: address,
        image: uploadResult.fileUrl,
      });

      triggerRefresh(); // ✅ notify Projects to re-fetch

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsUploading(false);
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0" />
      <div
        role="dialog"
        className="fixed z-50 bg-background shadow-lg transition ease-in-out duration-500 inset-y-0 right-0 h-full border-l slide-in-from-right w-full sm:max-w-xl md:max-w-2xl overflow-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col space-y-2 text-center sm:text-left p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">Create New Project</h2>
            <p className="text-sm text-muted-foreground">Set up your project basics and visual identity.</p>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-auto space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Project Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your creative project title"
                required
                disabled={isLoading}
                className="input"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Short Pitch <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">({description.length}/500)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                required
                disabled={isLoading}
                className="textarea h-24"
                placeholder="Describe your project..."
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={isLoading}
                className="input"
              >
                <option value="">Select a category</option>
                <option value="movies">Movies</option>
                <option value="comics">Comics</option>
                <option value="music">Music</option>
                <option value="art">Art</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <label htmlFor="goal" className="text-sm font-medium">
                Funding Goal (ETH) <span className="text-destructive">*</span>
              </label>
              <input
                id="goal"
                type="number"
                step="0.01"
                min="0"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                disabled={isLoading}
                className="input"
                placeholder="0.00"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cover Image/Icon <span className="text-destructive">*</span>
              </label>
              {!imagePreview ? (
                <div className="upload-box">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload cover image or icon</p>
                  <p className="text-xs text-muted-foreground mb-4">Supports JPG, PNG, SVG (Max 5MB)</p>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <label htmlFor="image" className="upload-btn">Select File</label>
                </div>
              ) : (
                <div className="relative border rounded-md p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={isLoading}
                        className="remove-image-btn"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{image?.name}</p>
                      <p className="text-xs text-muted-foreground">{(image!.size / 1024 / 1024).toFixed(2)}MB</p>
                      <input
                        type="file"
                        id="replaceImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                      <label htmlFor="replaceImage" className="text-xs text-primary hover:underline cursor-pointer">
                        Replace image
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Uploading image to IPFS...
                </div>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !image}
              className="btn-primary"
            >
              {isCreating ? "Creating..." : isUploading ? "Uploading..." : (
                <>
                  Create Project <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Close (X) */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  );
}
