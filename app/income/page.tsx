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

interface Income {
  id: number;
  type: "salary" | "asset";
  amount: number;
  assetType?: string;
  description?: string;
  year: number;
  month: number;
  timestamp: number;
}

interface FormState {
  type: "salary" | "asset";
  amount: string;
  assetType: string;
  description: string;
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<FormState>({
    type: "salary",
    amount: "",
    assetType: "",
    description: "",
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate year options (current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Filter incomes by selected year and month
  const filteredIncomes = incomes.filter(inc => 
    inc.year === selectedYear && inc.month === selectedMonth
  );

  useEffect(() => {
    // Load incomes from localStorage first
    const savedIncomes = localStorage.getItem("incomes");
    if (savedIncomes) {
      try {
        const parsedIncomes = JSON.parse(savedIncomes);
        // Migrate old data to include year, month, and timestamp
        const migratedIncomes = parsedIncomes.map((inc: any) => {
          if (!inc.year || !inc.month || !inc.timestamp) {
            const now = new Date();
            return {
              ...inc,
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              timestamp: now.getTime()
            };
          }
          return inc;
        });
        setIncomes(migratedIncomes);
      } catch (error) {
        console.error("Error loading incomes:", error);
      }
    }

    // Load assets from localStorage
    const savedAssets = localStorage.getItem("assets");
    if (savedAssets) {
      try {
        const parsedAssets = JSON.parse(savedAssets);
        setAssets(parsedAssets);
      } catch (error) {
        console.error("Error loading assets:", error);
      }
    }

    // Load asset types from localStorage (set by Assets page)
    const stored = localStorage.getItem("incomeAssetTypes");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssetTypes(parsed);
        } else {
          // fallback to default
          setAssetTypes(["Real Estate", "Stocks", "Bonds", "Other"]);
        }
      } catch {
        // fallback to default
        setAssetTypes(["Real Estate", "Stocks", "Bonds", "Other"]);
      }
    } else {
      // fallback to default
      setAssetTypes(["Real Estate", "Stocks", "Bonds", "Other"]);
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only save to localStorage after initial load is complete
    if (isInitialized) {
      localStorage.setItem("incomes", JSON.stringify(incomes));
    }
  }, [incomes, isInitialized]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-fill amount and description when asset type is selected
    if (name === "assetType" && value && form.type === "asset") {
      const selectedAsset = assets.find(asset => asset.type === value);
      if (selectedAsset) {
        // Use monthly income amount if available, otherwise use asset value
        const amountToUse = selectedAsset.isMonthlyIncome && selectedAsset.monthlyIncomeAmount 
          ? selectedAsset.monthlyIncomeAmount 
          : selectedAsset.value;
        
        setForm(prev => ({
          ...prev,
          amount: amountToUse.toString(),
          description: selectedAsset.description || ""
        }));
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.amount || (form.type === "asset" && !form.assetType)) return;
    
    const now = new Date();
    const newIncome: Income = {
      id: Date.now(),
      type: form.type,
      amount: parseFloat(form.amount),
      assetType: form.type === "asset" ? form.assetType : undefined,
      description: form.description,
      year: selectedYear,
      month: selectedMonth,
      timestamp: now.getTime(),
    };

    setIncomes((prev) => [...prev, newIncome]);

    // If this is an asset income, deduct from the asset value
    if (form.type === "asset" && form.assetType) {
      const selectedAsset = assets.find(asset => asset.type === form.assetType);
      if (selectedAsset) {
        const updatedAssets = assets.map(asset => {
          if (asset.type === form.assetType) {
            // Deduct the income amount from the asset value
            const newValue = Math.max(0, asset.value - parseFloat(form.amount));
            return {
              ...asset,
              value: newValue,
              // Recalculate monthly income if applicable
              monthlyIncomeAmount: asset.isMonthlyIncome && asset.interestRate 
                ? (newValue * (asset.interestRate / 100)) / 12 
                : asset.monthlyIncomeAmount
            };
          }
          return asset;
        });
        
        setAssets(updatedAssets);
        // Update assets in localStorage
        localStorage.setItem("assets", JSON.stringify(updatedAssets));
        
        // Update asset types for the income page
        const assetTypes = [...new Set(updatedAssets.map(asset => asset.type))];
        localStorage.setItem("incomeAssetTypes", JSON.stringify(assetTypes));
      }
    }

    setForm({ type: "salary", amount: "", assetType: "", description: "" });
  };

  const handleRemove = (id: number) => {
    const incomeToRemove = incomes.find(inc => inc.id === id);
    
    // If removing an asset income, restore the asset value
    if (incomeToRemove && incomeToRemove.type === "asset" && incomeToRemove.assetType) {
      const updatedAssets = assets.map(asset => {
        if (asset.type === incomeToRemove.assetType) {
          // Restore the income amount to the asset value
          const newValue = asset.value + incomeToRemove.amount;
          return {
            ...asset,
            value: newValue,
            // Recalculate monthly income if applicable
            monthlyIncomeAmount: asset.isMonthlyIncome && asset.interestRate 
              ? (newValue * (asset.interestRate / 100)) / 12 
              : asset.monthlyIncomeAmount
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      // Update assets in localStorage
      localStorage.setItem("assets", JSON.stringify(updatedAssets));
      
      // Update asset types for the income page
      const assetTypes = [...new Set(updatedAssets.map(asset => asset.type))];
      localStorage.setItem("incomeAssetTypes", JSON.stringify(assetTypes));
    }
    
    setIncomes((prev) => prev.filter((inc) => inc.id !== id));
  };

  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-4">Income Tracker</h1>
      
      {/* Year and Month Selection */}
      <div className="flex gap-4 w-full max-w-md">
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-medium">Year</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-medium">Month</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {monthOptions.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
      </div>

      <form
        className="flex flex-col gap-4 w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded shadow"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label className="font-medium">Income Type</label>
          <select
            className="border rounded px-2 py-1"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="salary">Salary</option>
            <option value="asset">Asset</option>
          </select>
        </div>
        {form.type === "asset" && (
          <div className="flex flex-col gap-1">
            <label className="font-medium">Asset Type</label>
            <select
              className="border rounded px-2 py-1"
              name="assetType"
              value={form.assetType}
              onChange={handleChange}
            >
              <option value="">Select Asset Type</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Amount</label>
          <input
            className="border rounded px-2 py-1"
            name="amount"
            type="number"
            min="0"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </div>
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
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700"
        >
          Add Income
        </button>
      </form>
      <div className="w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 mb-6 flex flex-col gap-2">
          <div>Total Income: <span className="font-semibold">${totalIncome.toFixed(2)}</span></div>
        </div>
        <h2 className="text-lg font-semibold mb-2">Incomes</h2>
        {filteredIncomes.length === 0 ? (
          <p className="text-gray-500">No incomes added for this month yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredIncomes.map((inc) => (
              <li key={inc.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium">{inc.type === "salary" ? "Salary" : `Asset (${inc.assetType})`}</span>
                  {inc.description && (
                    <span className="text-xs text-gray-500">{inc.description}</span>
                  )}
                  <span>${inc.amount.toFixed(2)}</span>
                </div>
                <button
                  className="text-red-600 hover:underline text-xs"
                  onClick={() => handleRemove(inc.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 