"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Asset {
  id: number;
  type: string;
  value: number;
  isMonthlyIncome: boolean;
  interestRate?: number;
  monthlyIncomeAmount?: number;
  description?: string;
}

interface FormState {
  type: string;
  value: string;
  isMonthlyIncome: boolean;
  interestRate: string;
  description: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<FormState>({
    type: "",
    value: "",
    isMonthlyIncome: false,
    interestRate: "",
    description: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load assets from localStorage first
    const savedAssets = localStorage.getItem("assets");
    if (savedAssets) {
      try {
        const parsedAssets = JSON.parse(savedAssets);
        setAssets(parsedAssets);
      } catch (error) {
        console.error("Error loading assets:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only save to localStorage after initial load is complete
    if (isInitialized) {
      localStorage.setItem("assets", JSON.stringify(assets));
      // Save unique asset types for the income page
      const assetTypes = [...new Set(assets.map(asset => asset.type))];
      localStorage.setItem("incomeAssetTypes", JSON.stringify(assetTypes));
    }
  }, [assets, isInitialized]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateMonthlyIncome = (value: number, interestRate: number): number => {
    return (value * (interestRate / 100)) / 12;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.type || !form.value) return;
    const assetValue = parseFloat(form.value);
    let monthlyIncomeAmount: number | undefined = undefined;
    if (form.isMonthlyIncome && form.interestRate) {
      monthlyIncomeAmount = calculateMonthlyIncome(assetValue, parseFloat(form.interestRate));
    }
    const newAsset: Asset = {
      id: Date.now(),
      type: form.type,
      value: assetValue,
      isMonthlyIncome: form.isMonthlyIncome,
      interestRate: form.isMonthlyIncome && form.interestRate ? parseFloat(form.interestRate) : undefined,
      monthlyIncomeAmount,
      description: form.description,
    };
    setAssets((prev) => [...prev, newAsset]);
    setForm({ type: "", value: "", isMonthlyIncome: false, interestRate: "", description: "" });
  };

  const handleRemove = (id: number) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  };

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalMonthlyIncome = assets
    .filter(asset => asset.isMonthlyIncome && asset.monthlyIncomeAmount)
    .reduce((sum, asset) => sum + (asset.monthlyIncomeAmount || 0), 0);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-4">Assets Tracker</h1>
      <form
        className="flex flex-col gap-4 w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded shadow"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label className="font-medium">Asset Type</label>
          <input
            className="border rounded px-2 py-1"
            name="type"
            type="text"
            value={form.type}
            onChange={handleChange}
            placeholder="e.g., Real Estate, Stocks, Bonds"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Asset Value ($)</label>
          <input
            className="border rounded px-2 py-1"
            name="value"
            type="number"
            min="0"
            step="0.01"
            value={form.value}
            onChange={handleChange}
            placeholder="Enter asset value"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isMonthlyIncome"
            name="isMonthlyIncome"
            checked={form.isMonthlyIncome}
            onChange={handleChange}
            className="rounded"
          />
          <label htmlFor="isMonthlyIncome" className="font-medium">
            Generate Monthly Income
          </label>
        </div>
        {form.isMonthlyIncome && (
          <div className="flex flex-col gap-1">
            <label className="font-medium">Annual Interest Rate (%)</label>
            <input
              className="border rounded px-2 py-1"
              name="interestRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.interestRate}
              onChange={handleChange}
              placeholder="e.g., 5.5"
              required={form.isMonthlyIncome}
            />
            {form.interestRate && form.value && (
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                Monthly Income: ${calculateMonthlyIncome(parseFloat(form.value), parseFloat(form.interestRate)).toFixed(2)}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Description</label>
          <input
            className="border rounded px-2 py-1"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description (optional)"
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700"
        >
          Add Asset
        </button>
      </form>
      <div className="w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 mb-6 flex flex-col gap-2">
          <div>Total Asset Value: <span className="font-semibold">${totalAssetValue.toFixed(2)}</span></div>
          <div>Total Monthly Income: <span className="font-semibold text-green-600 dark:text-green-400">${totalMonthlyIncome.toFixed(2)}</span></div>
        </div>
        <h2 className="text-lg font-semibold mb-2">Assets</h2>
        {assets.length === 0 ? (
          <p className="text-gray-500">No assets added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {assets.map((asset) => (
              <li key={asset.id} className="py-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{asset.type}</span>
                    {asset.description && (
                      <span className="text-xs text-gray-500">{asset.description}</span>
                    )}
                  </div>
                  <button
                    className="text-red-600 hover:underline text-xs"
                    onClick={() => handleRemove(asset.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <div>Value: <span className="font-semibold">${asset.value.toFixed(2)}</span></div>
                  {asset.isMonthlyIncome && asset.interestRate && asset.monthlyIncomeAmount && (
                    <div className="text-green-600 dark:text-green-400">
                      Monthly Income: ${asset.monthlyIncomeAmount.toFixed(2)}
                      <span className="text-gray-500"> ({asset.interestRate}% annual rate)</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 