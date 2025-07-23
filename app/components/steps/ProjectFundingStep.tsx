"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { ProjectFormData } from "./types"; // adjust if needed

interface ProjectFundingStepProps {
  formData: ProjectFormData;
  setFormData: (data: Partial<ProjectFormData>) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export function ProjectFundingStep({
  formData,
  setFormData,
  onBack,
  onNext,
  isLoading,
}: ProjectFundingStepProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col space-y-2 text-center sm:text-left p-6 border-b">
        <h2 className="text-lg font-semibold text-foreground">Funding Details</h2>
        <p className="text-sm text-muted-foreground">
          Set your project’s funding parameters including goal, caps, and deadlines.
        </p>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Funding Goal */}
        <div>
          <label className="text-sm font-medium">Funding Goal (ETH)</label>
          <input
            type="number"
            value={formData.goal}
            onChange={(e) => setFormData({ goal: e.target.value })}
            placeholder="e.g. 5"
            className="input"
          />
        </div>

        {/* Threshold */}
        <div>
          <label className="text-sm font-medium">Threshold (ETH)</label>
          <input
            type="number"
            value={formData.threshold}
            onChange={(e) => setFormData({ threshold: e.target.value })}
            placeholder="e.g. 2"
            className="input"
          />
        </div>

        {/* Max Cap */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.hasMaxCap}
              onChange={(e) => setFormData({ hasMaxCap: e.target.checked })}
            />
            Enable Max Cap
          </label>
          {formData.hasMaxCap && (
            <input
              type="number"
              value={formData.maxCap}
              onChange={(e) => setFormData({ maxCap: e.target.value })}
              placeholder="Optional Max Cap"
              className="input mt-2"
            />
          )}
        </div>

        {/* Funding Deadline */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.hasDeadline}
              onChange={(e) => setFormData({ hasDeadline: e.target.checked })}
            />
            Enable Funding Deadline
          </label>
          {formData.hasDeadline && (
            <input
              type="date"
              value={formData.fundingDeadline}
              onChange={(e) => setFormData({ fundingDeadline: e.target.value })}
              className="input mt-2"
            />
          )}
        </div>

        {/* Delivery Date */}
        <div>
          <label className="text-sm font-medium">Delivery Date</label>
          <input
            type="date"
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ deliveryDate: e.target.value })}
            className="input"
          />
        </div>

        {/* Funding Increments */}
        <div>
          <label className="text-sm font-medium">Funding Increments (ETH)</label>
          <input
            type="number"
            value={formData.fundingIncrements}
            onChange={(e) => setFormData({ fundingIncrements: e.target.value })}
            placeholder="e.g. 0.1"
            className="input"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="btn-outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading || !formData.goal}
          className="btn-primary"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
