// ProjectReviewStep.tsx
import Image from "next/image";

interface ProjectReviewStepProps {
  title: string;
  description: string;
  category: string;
  goal: string;
  imagePreview: string | null;
  onBack: () => void;
  isLoading: boolean;
}

export function ProjectReviewStep({
  title,
  description,
  category,
  goal,
  imagePreview,
  onBack,
  isLoading,
}: ProjectReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Project Summary</h3>
        <div className="grid gap-3 text-sm">
  <div><strong>Title:</strong> {title || "N/A"}</div>
  <div><strong>Description:</strong> {description || "N/A"}</div>
  <div><strong>Category:</strong> {category || "N/A"}</div>
  <div><strong>Goal:</strong> {goal || "0"} ETH</div>
</div>
      </div>

      {imagePreview && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Cover Image</h4>
          <Image
            src={imagePreview}
            alt="Project Cover Preview"
            width={300}
            height={300}
            className="rounded-md border"
          />
        </div>
      )}

      <div className="pt-4 border-t flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="btn-outline"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? "Launching..." : "Launch Project"}
        </button>
      </div>
    </div>
  );
}
