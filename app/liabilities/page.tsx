"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Liability {
  id: number;
  type: string;
  amount: number;
  interestRate: number;
  hasMonthlyPayment: boolean;
  description?: string;
}

interface FormState {
  type: string;
  amount: string;
  interestRate: string;
  hasMonthlyPayment: boolean;
  description: string;
}

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [form, setForm] = useState<FormState>({
    type: "",
    amount: "",
    interestRate: "",
    hasMonthlyPayment: false,
    description: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load liabilities from localStorage first
    const savedLiabilities = localStorage.getItem("liabilities");
    if (savedLiabilities) {
      try {
        const parsedLiabilities = JSON.parse(savedLiabilities);
        setLiabilities(parsedLiabilities);
      } catch (error) {
        console.error("Error loading liabilities:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only save to localStorage after initial load is complete
    if (isInitialized) {
      localStorage.setItem("liabilities", JSON.stringify(liabilities));
      
      // Save liabilities with monthly payments for the expenditure page
      const monthlyLiabilities = liabilities
        .filter(liability => liability.hasMonthlyPayment)
        .map(liability => {
          const monthlyPayment = calculateMonthlyPayment(liability.amount, liability.interestRate);
          return {
            type: liability.type,
            amount: monthlyPayment // Use calculated monthly payment instead of total amount
          };
        });
      localStorage.setItem("expenditureLiabilities", JSON.stringify(monthlyLiabilities));
    }
  }, [liabilities, isInitialized]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateMonthlyPayment = (principal: number, annualRate: number): number => {
    // Convert annual rate to monthly rate
    const monthlyRate = annualRate / 100 / 12;
    
    // Calculate monthly payment using the loan payment formula
    // P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    // Where: P = monthly payment, L = loan amount, c = monthly interest rate, n = total number of payments
    
    // For simplicity, assuming a 30-year term (360 payments) for most loans
    // You can adjust this based on the liability type if needed
    const numberOfPayments = 360; // 30 years * 12 months
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments; // No interest
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return monthlyPayment;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.type || !form.amount || !form.interestRate) return;
    
    const principal = parseFloat(form.amount);
    const annualRate = parseFloat(form.interestRate);
    let monthlyPaymentAmount = 0;
    
    if (form.hasMonthlyPayment) {
      monthlyPaymentAmount = calculateMonthlyPayment(principal, annualRate);
    }
    
    const newLiability: Liability = {
      id: Date.now(),
      type: form.type,
      amount: principal,
      interestRate: annualRate,
      hasMonthlyPayment: form.hasMonthlyPayment,
      description: form.description,
    };

    setLiabilities((prev) => [...prev, newLiability]);
    setForm({
      type: "",
      amount: "",
      interestRate: "",
      hasMonthlyPayment: false,
      description: "",
    });
  };

  const handleRemove = (id: number) => {
    setLiabilities((prev) => prev.filter((liability) => liability.id !== id));
  };

  const totalLiabilityAmount = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  const totalMonthlyLiabilities = liabilities.filter(liability => liability.hasMonthlyPayment).length;
  const totalMonthlyPayments = liabilities
    .filter(liability => liability.hasMonthlyPayment)
    .reduce((sum, liability) => sum + calculateMonthlyPayment(liability.amount, liability.interestRate), 0);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-4">Liabilities Tracker</h1>
      
      <form
        className="flex flex-col gap-4 w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded shadow"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label className="font-medium">Liability Type</label>
          <input
            className="border rounded px-2 py-1"
            name="type"
            type="text"
            value={form.type}
            onChange={handleChange}
            placeholder="e.g., Credit Card, Student Loan, Mortgage"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-medium">Total Amount ($)</label>
          <input
            className="border rounded px-2 py-1"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="Enter total liability amount"
            required
          />
        </div>

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
            placeholder="e.g., 15.99"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasMonthlyPayment"
            name="hasMonthlyPayment"
            checked={form.hasMonthlyPayment}
            onChange={handleChange}
            className="rounded"
          />
          <label htmlFor="hasMonthlyPayment" className="font-medium">
            Have to pay monthly
          </label>
        </div>

        {form.hasMonthlyPayment && form.amount && form.interestRate && (
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            Monthly Payment: ${calculateMonthlyPayment(parseFloat(form.amount), parseFloat(form.interestRate)).toFixed(2)}
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
          className="bg-red-600 text-white rounded px-4 py-2 font-semibold hover:bg-red-700"
        >
          Add Liability
        </button>
      </form>

      <div className="w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 mb-6 flex flex-col gap-2">
          <div>Total Liabilities: <span className="font-semibold text-red-600 dark:text-red-400">${totalLiabilityAmount.toFixed(2)}</span></div>
          <div>Monthly Payment Liabilities: <span className="font-semibold text-red-600 dark:text-red-400">{totalMonthlyLiabilities}</span></div>
          <div>Total Monthly Payments: <span className="font-semibold text-red-600 dark:text-red-400">${totalMonthlyPayments.toFixed(2)}</span></div>
        </div>

        <h2 className="text-lg font-semibold mb-2">Liabilities</h2>
        {liabilities.length === 0 ? (
          <p className="text-gray-500">No liabilities added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {liabilities.map((liability) => (
              <li key={liability.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium">{liability.type}</span>
                  {liability.description && (
                    <span className="text-xs text-gray-500">{liability.description}</span>
                  )}
                  <span className="text-red-600 dark:text-red-400">${liability.amount.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">{liability.interestRate}%</span>
                  {liability.hasMonthlyPayment && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Monthly: ${calculateMonthlyPayment(liability.amount, liability.interestRate).toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  className="text-red-600 hover:underline text-xs"
                  onClick={() => handleRemove(liability.id)}
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