// components/ProjectFundingStep.tsx

import { ArrowRight, ArrowLeft } from "lucide-react";

interface ProjectFundingStepProps {
  formData: {
    goal: string;
    threshold: string;
    maxCap: string;
    hasMaxCap: boolean;
    hasDeadline: boolean;
    fundingDeadline: string;
    deliveryDate: string;
    fundingIncrements: string;
  };
  setFormData: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export default function ProjectFundingStep({
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
        <div>
          <label className="text-sm font-medium">Funding Goal (ETH)</label>
          <input
            type="number"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="e.g. 5"
            className="input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Threshold (ETH)</label>
          <input
            type="number"
            value={formData.threshold}
            onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
            placeholder="e.g. 2"
            className="input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Max Cap (ETH)</label>
          <input
            type="number"
            value={formData.maxCap}
            onChange={(e) => setFormData({ ...formData, maxCap: e.target.value })}
            placeholder="Optional"
            className="input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Funding Deadline</label>
          <input
            type="date"
            value={formData.fundingDeadline}
            onChange={(e) => setFormData({ ...formData, fundingDeadline: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Delivery Date</label>
          <input
            type="date"
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Funding Increments (ETH)</label>
          <input
            type="number"
            value={formData.fundingIncrements}
            onChange={(e) => setFormData({ ...formData, fundingIncrements: e.target.value })}
            placeholder="e.g. 0.1"
            className="input"
          />
        </div>
      </div>

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
