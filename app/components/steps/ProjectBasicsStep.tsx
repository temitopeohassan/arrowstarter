// ProjectBasicsStep.tsx
import { Upload, X } from "lucide-react";

export function ProjectBasicsStep({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  image,
  imagePreview,
  isUploading,
  isLoading,
  error,
  handleImageChange,
  removeImage
}: any) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}
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
    </div>
  );
}
