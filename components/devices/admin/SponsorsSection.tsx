"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Sponsor } from "./shared-types";

interface SponsorsSectionProps {
  sponsors: Sponsor[];
  q: string;
  setQ: (query: string) => void;
  onCreateSponsor: (
    name: string,
    tier: 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions',
    logo: string,
    description: string,
    benefits: string[],
    websiteUrl: string
  ) => Promise<void>;
  onUpdateSponsor: (
    id: string,
    updates: {
      name?: string;
      tier?: 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions';
      logo?: string;
      description?: string;
      benefits?: string[];
      websiteUrl?: string;
      isActive?: boolean;
    }
  ) => Promise<void>;
  onDeleteSponsor: (id: string) => Promise<void>;
}

export default function SponsorsSection({
  sponsors,
  q,
  setQ,
  onCreateSponsor,
  onUpdateSponsor,
  onDeleteSponsor,
}: SponsorsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    tier: "binary-titans" as 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions',
    logo: "",
    description: "",
    benefits: [] as string[],
    websiteUrl: "",
    isActive: true,
  });
  const [benefitsInput, setBenefitsInput] = useState("");

  const filtered = sponsors.filter((sponsor) =>
    sponsor.name.toLowerCase().includes(q.toLowerCase()) ||
    sponsor.description.toLowerCase().includes(q.toLowerCase()) ||
    sponsor.tier.toLowerCase().includes(q.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.logo.trim() || !formData.websiteUrl.trim()) return;

    try {
      await onCreateSponsor(
        formData.name,
        formData.tier,
        formData.logo,
        formData.description,
        formData.benefits,
        formData.websiteUrl
      );
      setFormData({
        name: "",
        tier: "binary-titans",
        logo: "",
        description: "",
        benefits: [],
        websiteUrl: "",
        isActive: true,
      });
      setBenefitsInput("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create sponsor:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSponsor || !formData.name.trim() || !formData.logo.trim() || !formData.websiteUrl.trim()) return;

    try {
      await onUpdateSponsor(editingSponsor._id, {
        name: formData.name,
        tier: formData.tier,
        logo: formData.logo,
        description: formData.description,
        benefits: formData.benefits,
        websiteUrl: formData.websiteUrl,
        isActive: formData.isActive,
      });
      setEditingSponsor(null);
      setFormData({
        name: "",
        tier: "binary-titans",
        logo: "",
        description: "",
        benefits: [],
        websiteUrl: "",
        isActive: true,
      });
      setBenefitsInput("");
    } catch (error) {
      console.error("Failed to update sponsor:", error);
    }
  };

  const startEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      tier: sponsor.tier,
      logo: sponsor.logo,
      description: sponsor.description,
      benefits: sponsor.benefits || [],
      websiteUrl: sponsor.websiteUrl,
      isActive: sponsor.isActive,
    });
    setBenefitsInput((sponsor.benefits || []).join(", "));
  };

  const cancelEdit = () => {
    setEditingSponsor(null);
    setFormData({
      name: "",
      tier: "binary-titans",
      logo: "",
      description: "",
      benefits: [],
      websiteUrl: "",
      isActive: true,
    });
    setBenefitsInput("");
  };

  const addBenefit = () => {
    if (benefitsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitsInput.trim()]
      }));
      setBenefitsInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleBenefitsInputChange = (value: string) => {
    setBenefitsInput(value);
    // Auto-parse comma-separated benefits
    if (value.includes(",")) {
      const benefits = value.split(",").map(b => b.trim()).filter(b => b);
      setFormData(prev => ({ ...prev, benefits }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs"
        >
          {showCreateForm ? "Cancel" : "New Sponsor"}
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sponsors"
          className="ml-auto px-2 py-1 bg-neutral-800 rounded text-xs"
        />
      </div>

      {(showCreateForm || editingSponsor) && (
        <div className="p-4 bg-neutral-800 rounded space-y-3">
          <h3 className="text-sm font-bold">
            {editingSponsor ? "Edit Sponsor" : "Create New Sponsor"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Sponsor Name"
              className="px-2 py-1 bg-neutral-700 rounded text-xs"
            />
            <select
              value={formData.tier}
              onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as 'quantum-guardians' | 'cyber-sentinels' | 'binary-titans' | 'firewall-champions' }))}
              className="px-2 py-1 bg-neutral-700 rounded text-xs"
            >
              <option value="quantum-guardians">Quantum Guardians</option>
              <option value="cyber-sentinels">Cyber Sentinels</option>
              <option value="binary-titans">Binary Titans</option>
              <option value="firewall-champions">Firewall Champions</option>
            </select>
          </div>

          <input
            value={formData.logo}
            onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
            placeholder="Logo URL"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />

          <input
            value={formData.websiteUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
            placeholder="Website URL"
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />

          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            rows={3}
            className="w-full px-2 py-1 bg-neutral-700 rounded text-xs"
          />

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={benefitsInput}
                onChange={(e) => handleBenefitsInputChange(e.target.value)}
                placeholder="Add benefit (or comma-separated list)"
                className="flex-1 px-2 py-1 bg-neutral-700 rounded text-xs"
              />
              <button
                onClick={addBenefit}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-neutral-600 rounded text-xs flex items-center gap-1"
                >
                  {benefit}
                  <button
                    onClick={() => removeBenefit(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              id="isActive"
            />
            <label htmlFor="isActive" className="text-xs">Active</label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={editingSponsor ? handleUpdate : handleCreate}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs"
            >
              {editingSponsor ? "Update" : "Create"}
            </button>
            {editingSponsor && (
              <button
                onClick={cancelEdit}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((sponsor) => (
          <div key={sponsor._id} className="p-3 bg-neutral-800 rounded flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {sponsor.logo && (
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain rounded"
                  />
                )}
                <div>
                  <h4 className="font-bold text-sm">{sponsor.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    sponsor.tier === 'quantum-guardians' ? 'bg-purple-600' :
                    sponsor.tier === 'cyber-sentinels' ? 'bg-blue-600' :
                    sponsor.tier === 'binary-titans' ? 'bg-green-600' :
                    'bg-orange-600'
                  }`}>
                    {sponsor.tier.replace('-', ' ').toUpperCase()}
                  </span>
                  {!sponsor.isActive && (
                    <span className="text-xs px-2 py-1 bg-red-600 rounded ml-2">INACTIVE</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-400 mb-2">{sponsor.description}</p>
              {sponsor.websiteUrl && (
                <a
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {sponsor.websiteUrl}
                </a>
              )}
              {sponsor.benefits && sponsor.benefits.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-neutral-500 mb-1">Benefits:</p>
                  <div className="flex flex-wrap gap-1">
                    {sponsor.benefits.map((benefit, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-neutral-700 rounded">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-1 ml-4">
              <button
                onClick={() => startEdit(sponsor)}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteSponsor(sponsor._id)}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
