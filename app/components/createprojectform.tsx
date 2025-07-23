// components/CreateProjectForm.tsx
"use client";

import { useState } from "react";
import { X, ArrowRight, Upload } from "lucide-react";
import { useAccount } from "wagmi";
import { createProject, uploadFile } from "@/lib/api";
import { useProjectRefresh } from "@/context/ProjectRefreshContext";
import { ProjectBasicsStep } from "./steps/ProjectBasicsStep";
import { ProjectFundingStep } from "./steps/ProjectFundingStep";
import { ProjectReviewStep } from "./steps/ProjectReviewStep";
import { ProjectFormWithPreview } from "./steps/types"; // 👈 import correct type

const steps = ["Basics", "Funding", "Review"] as const;
type Step = (typeof steps)[number];

interface CreateProjectFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateProjectForm({ onClose, onSuccess }: CreateProjectFormProps) {
  const { address } = useAccount();
  const { triggerRefresh } = useProjectRefresh();

  const [step, setStep] = useState<Step>("Basics");

  const [formData, setFormData] = useState<ProjectFormWithPreview>({
    title: "",
    description: "",
    category: "",
    goal: "",
    threshold: "",
    maxCap: "",
    hasMaxCap: false,
    hasDeadline: false,
    fundingDeadline: "",
    deliveryDate: "",
    fundingIncrements: "",
    image: null,
    imagePreview: "",
  });

  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const isLoading = isUploading || isCreating;

  const updateField = (field: keyof ProjectFormWithPreview, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === "Basics") setStep("Funding");
    else if (step === "Funding") setStep("Review");
  };

  const prevStep = () => {
    if (step === "Review") setStep("Funding");
    else if (step === "Funding") setStep("Basics");
  };

  const handleLaunch = async () => {
    if (!address) return setError("Please connect your wallet");
    if (!formData.image) return setError("Please select a cover image");

    try {
      setError("");
      setIsUploading(true);

      const uploadResult = await uploadFile(formData.image);
      setIsUploading(false);

      setIsCreating(true);

      await createProject({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goal: parseFloat(formData.goal),
        creatorAddress: address,
        image: uploadResult.fileUrl,
      });

      triggerRefresh();
      onSuccess?.();
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
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Create New Project</h2>
            <p className="text-sm text-muted-foreground">Step {steps.indexOf(step) + 1} of 3: {step}</p>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {step === "Basics" && (
              <ProjectBasicsStep
                formData={formData}
                updateField={updateField}
                isLoading={isLoading}
              />
            )}

            {step === "Funding" && (
              <ProjectFundingStep
                formData={formData}
                setFormData={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                onBack={prevStep}
                onNext={nextStep}
                isLoading={isLoading}
              />
            )}

            {step === "Review" && (
              <ProjectReviewStep formData={formData} />
            )}

            {isUploading && (
              <div className="mt-4 space-y-1">
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
            {step !== "Basics" ? (
              <button onClick={prevStep} disabled={isLoading} className="btn-outline">
                Back
              </button>
            ) : (
              <button onClick={onClose} disabled={isLoading} className="btn-outline">
                Cancel
              </button>
            )}

            {step === "Review" ? (
              <button
                onClick={handleLaunch}
                disabled={isLoading || !formData.image}
                className="btn-primary"
              >
                {isCreating ? "Creating..." : isUploading ? "Uploading..." : "Launch Project"}
              </button>
            ) : (
              <button onClick={nextStep} disabled={isLoading} className="btn-primary">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Close button */}
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
