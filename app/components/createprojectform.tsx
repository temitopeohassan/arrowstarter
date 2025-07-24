"use client";

import { useState } from "react";
import { ProjectFormData } from "./steps/types";
import { ProjectReviewStep } from "./project-review-step";
import { log } from "@/lib/logs"; // ✅ Logging utility

const initialFormData: ProjectFormData = {
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
};

export default function CreateProjectForm() {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [step, setStep] = useState<"form" | "review">("form");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
      log(`[handleChange] Checkbox: ${name} → ${target.checked}`);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      log(`[handleChange] ${name} → ${value}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, image: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        log(`[handleImageChange] Preview ready for: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }

    log("[handleImageChange] File selected:", file?.name || "none");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log("[handleSubmit] Switching to review step");
    log("[handleSubmit] FormData:", JSON.stringify(formData, null, 2));
    setStep("review");
  };

  const handleLaunch = async () => {
    setIsLoading(true);
    log("[handleLaunch] Launch initiated");
    try {
      await new Promise((res) => setTimeout(res, 2000));
      log("[handleLaunch] Project launched successfully!");
    } catch (error) {
      log("[handleLaunch] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    log("[handleBack] Returning to form step");
    setStep("form");
  };

  if (step === "review") {
    return (
      <ProjectReviewStep
        title={formData.title}
        description={formData.description}
        category={formData.category}
        goal={formData.goal}
        imagePreview={imagePreview}
        onBack={handleBack}
        isLoading={isLoading}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Create New Project</h2>

      <input
        type="text"
        name="title"
        placeholder="Project Title"
        value={formData.title}
        onChange={handleChange}
        className="input"
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="input"
      />

      <input
        type="text"
        name="category"
        placeholder="Category"
        value={formData.category}
        onChange={handleChange}
        className="input"
      />

      <input
        type="number"
        name="goal"
        placeholder="Goal (ETH)"
        value={formData.goal}
        onChange={handleChange}
        className="input"
      />

      <input
        type="checkbox"
        name="hasMaxCap"
        checked={formData.hasMaxCap}
        onChange={handleChange}
      />{" "}
      Has Max Cap

      {formData.hasMaxCap && (
        <input
          type="number"
          name="maxCap"
          placeholder="Max Cap (ETH)"
          value={formData.maxCap}
          onChange={handleChange}
          className="input"
        />
      )}

      <input
        type="checkbox"
        name="hasDeadline"
        checked={formData.hasDeadline}
        onChange={handleChange}
      />{" "}
      Has Deadline

      {formData.hasDeadline && (
        <input
          type="date"
          name="fundingDeadline"
          value={formData.fundingDeadline}
          onChange={handleChange}
          className="input"
        />
      )}

      <input
        type="date"
        name="deliveryDate"
        value={formData.deliveryDate}
        onChange={handleChange}
        className="input"
      />

      <input
        type="number"
        name="fundingIncrements"
        placeholder="Funding Increments"
        value={formData.fundingIncrements}
        onChange={handleChange}
        className="input"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="input"
      />

      <button type="submit" className="btn-primary">
        Next
      </button>
    </form>
  );
}
