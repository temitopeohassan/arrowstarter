'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { ProjectFormData } from '@/types';
import { logToServer } from '@/lib/logs';

export default function CreateProjectForm() {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    goal: '',
    threshold: '',
    maxCap: '',
    hasMaxCap: false,
    hasDeadline: false,
    fundingDeadline: '',
    deliveryDate: '',
    fundingIncrements: '',
    image: null,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Log mount
  useEffect(() => {
    console.log('[CreateProjectForm] Mounted');
    logToServer('[CreateProjectForm] Mounted');
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: val,
    }));

    console.log(`[handleChange] ${name}:`, val);
    logToServer(`[handleChange] ${name}: ${val}`);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData(prev => ({
      ...prev,
      image: file,
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    console.log('[handleImageChange] Image selected:', file.name);
    logToServer(`[handleImageChange] Image selected: ${file.name}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[handleSubmit] Form submitted with:', formData);
    await logToServer(`[handleSubmit] Data: ${JSON.stringify(formData, null, 2)}`);

    // TODO: Add your API call logic here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
      <input
        type="text"
        name="title"
        placeholder="Project Title"
        value={formData.title}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <textarea
        name="description"
        placeholder="Project Description"
        value={formData.description}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        rows={4}
        required
      />

      <input
        type="text"
        name="category"
        placeholder="Category"
        value={formData.category}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="number"
        name="goal"
        placeholder="Funding Goal (ETH)"
        value={formData.goal}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="number"
        name="threshold"
        placeholder="Funding Threshold (ETH)"
        value={formData.threshold}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="hasMaxCap"
          checked={formData.hasMaxCap}
          onChange={handleChange}
        />
        Has Max Cap?
      </label>

      {formData.hasMaxCap && (
        <input
          type="number"
          name="maxCap"
          placeholder="Maximum Cap (ETH)"
          value={formData.maxCap}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="hasDeadline"
          checked={formData.hasDeadline}
          onChange={handleChange}
        />
        Set a Deadline?
      </label>

      {formData.hasDeadline && (
        <input
          type="date"
          name="fundingDeadline"
          value={formData.fundingDeadline}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      )}

      <input
        type="date"
        name="deliveryDate"
        placeholder="Delivery Date"
        value={formData.deliveryDate}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        name="fundingIncrements"
        placeholder="Funding Increments (ETH)"
        value={formData.fundingIncrements}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full"
      />

      {previewImage && (
        <img src={previewImage} alt="Preview" className="w-full h-auto rounded border" />
      )}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
      >
        Submit Project
      </button>
    </form>
  );
}
