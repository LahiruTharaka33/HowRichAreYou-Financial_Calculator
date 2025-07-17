"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Expenditure {
  id: number;
  expenditureType: "personal" | "other";
  name?: string;
  liabilityType?: string;
  amount: number;
  type: "static" | "dynamic";
  state?: "high" | "medium" | "low";
  year: number;
  month: number;
  timestamp: number;
}

interface FormState {
  expenditureType: "personal" | "other";
  name: string;
  liabilityType: string;
  amount: string;
  type: "static" | "dynamic";
  state: "high" | "medium" | "low";
}

export default function ExpenditurePage() {
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [form, setForm] = useState<FormState>({
    expenditureType: "personal",
    name: "",
    liabilityType: "",
    amount: "",
    type: "static",
    state: "medium",
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [shownValue, setShownValue] = useState<"none" | "lean" | "comfortable">("none");
  const [isInitialized, setIsInitialized] = useState(false);
  const [liabilities, setLiabilities] = useState<Array<{type: string, amount: number}>>([]);
  const [fullLiabilities, setFullLiabilities] = useState<Array<{
    id: number;
    type: string;
    amount: number;
    interestRate: number;
    hasMonthlyPayment: boolean;
    description?: string;
  }>>([]);

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

  // Filter expenditures by selected year and month
  const filteredExpenditures = expenditures.filter(exp => 
    exp.year === selectedYear && exp.month === selectedMonth
  );

  useEffect(() => {
    // Load expenditures from localStorage first
    const savedExpenditures = localStorage.getItem("expenditures");
    if (savedExpenditures) {
      try {
        const parsedExpenditures = JSON.parse(savedExpenditures);
        // Migrate old data to include year, month, and timestamp
        const migratedExpenditures = parsedExpenditures.map((exp: any) => {
          if (!exp.year || !exp.month || !exp.timestamp) {
            const now = new Date();
            return {
              ...exp,
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              timestamp: now.getTime()
            };
          }
          return exp;
        });
        setExpenditures(migratedExpenditures);
      } catch (error) {
        console.error("Error loading expenditures:", error);
      }
    }

    // Load liabilities from localStorage (set by Liabilities page)
    const savedLiabilities = localStorage.getItem("expenditureLiabilities");
    if (savedLiabilities) {
      try {
        const parsedLiabilities = JSON.parse(savedLiabilities);
        setLiabilities(parsedLiabilities);
      } catch (error) {
        console.error("Error loading liabilities:", error);
      }
    }

    // Load full liabilities data for value deduction
    const savedFullLiabilities = localStorage.getItem("liabilities");
    if (savedFullLiabilities) {
      try {
        const parsedFullLiabilities = JSON.parse(savedFullLiabilities);
        setFullLiabilities(parsedFullLiabilities);
      } catch (error) {
        console.error("Error loading full liabilities:", error);
      }
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only save to localStorage after initial load is complete
    if (isInitialized) {
      localStorage.setItem("expenditures", JSON.stringify(expenditures));
    }
  }, [expenditures, isInitialized]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-fill amount when liability is selected
    if (name === "liabilityType" && value && form.expenditureType === "other") {
      const selectedLiability = liabilities.find(liability => liability.type === value);
      if (selectedLiability) {
        setForm(prev => ({
          ...prev,
          amount: selectedLiability.amount.toString()
        }));
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation based on expenditure type
    if (form.expenditureType === "personal" && (!form.name || !form.amount)) return;
    if (form.expenditureType === "other" && (!form.liabilityType || !form.amount)) return;
    
    const now = new Date();
    const newExpenditure: Expenditure = {
      id: Date.now(),
      expenditureType: form.expenditureType,
      name: form.expenditureType === "personal" ? form.name : undefined,
      liabilityType: form.expenditureType === "other" ? form.liabilityType : undefined,
      amount: parseFloat(form.amount),
      type: form.type,
      state: form.type === "dynamic" ? form.state : undefined,
      year: selectedYear,
      month: selectedMonth,
      timestamp: now.getTime(),
    };

    setExpenditures((prev) => [...prev, newExpenditure]);

    // If this is a liability expenditure, deduct from the liability value
    if (form.expenditureType === "other" && form.liabilityType) {
      const selectedLiability = fullLiabilities.find(liability => liability.type === form.liabilityType);
      if (selectedLiability) {
        const updatedFullLiabilities = fullLiabilities.map(liability => {
          if (liability.type === form.liabilityType) {
            // Deduct the expenditure amount from the liability value
            const newValue = Math.max(0, liability.amount - parseFloat(form.amount));
            return {
              ...liability,
              amount: newValue
            };
          }
          return liability;
        });
        
        setFullLiabilities(updatedFullLiabilities);
        // Update full liabilities in localStorage
        localStorage.setItem("liabilities", JSON.stringify(updatedFullLiabilities));
        
        // Update expenditure liabilities (monthly payments)
        const updatedLiabilities = updatedFullLiabilities
          .filter(liability => liability.hasMonthlyPayment)
          .map(liability => {
            // Recalculate monthly payment based on new liability value
            const monthlyRate = liability.interestRate / 100 / 12;
            const numberOfPayments = 360; // 30 years
            const monthlyPayment = liability.amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                                  (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            return {
              type: liability.type,
              amount: monthlyPayment
            };
          });
        
        setLiabilities(updatedLiabilities);
        localStorage.setItem("expenditureLiabilities", JSON.stringify(updatedLiabilities));
      }
    }

    setForm({
      expenditureType: "personal",
      name: "",
      liabilityType: "",
      amount: "",
      type: "static",
      state: "medium",
    });
  };

  const handleRemove = (id: number) => {
    const expenditureToRemove = expenditures.find(exp => exp.id === id);
    
    // If removing a liability expenditure, restore the liability value
    if (expenditureToRemove && expenditureToRemove.expenditureType === "other" && expenditureToRemove.liabilityType) {
      const updatedFullLiabilities = fullLiabilities.map(liability => {
        if (liability.type === expenditureToRemove.liabilityType) {
          // Restore the expenditure amount to the liability value
          const newValue = liability.amount + expenditureToRemove.amount;
          return {
            ...liability,
            amount: newValue
          };
        }
        return liability;
      });
      
      setFullLiabilities(updatedFullLiabilities);
      // Update full liabilities in localStorage
      localStorage.setItem("liabilities", JSON.stringify(updatedFullLiabilities));
      
      // Update expenditure liabilities (monthly payments)
      const updatedLiabilities = updatedFullLiabilities
        .filter(liability => liability.hasMonthlyPayment)
        .map(liability => {
          // Recalculate monthly payment based on new liability value
          const monthlyRate = liability.interestRate / 100 / 12;
          const numberOfPayments = 360; // 30 years
          const monthlyPayment = liability.amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
          return {
            type: liability.type,
            amount: monthlyPayment
          };
        });
      
      setLiabilities(updatedLiabilities);
      localStorage.setItem("expenditureLiabilities", JSON.stringify(updatedLiabilities));
    }
    
    setExpenditures((prev) => prev.filter((exp) => exp.id !== id));
  };

  // Summary calculations for filtered data
  const essentialTotal = filteredExpenditures
    .filter((exp) => exp.type === "static")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const tightTotal = filteredExpenditures
    .filter((exp) => exp.type === "static" || (exp.type === "dynamic" && exp.state === "high"))
    .reduce((sum, exp) => sum + exp.amount, 0);
  const lightTotal = filteredExpenditures
    .filter((exp) =>
      exp.type === "static" ||
      (exp.type === "dynamic" && (exp.state === "high" || exp.state === "low"))
    )
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-4">Expenditure Tracker</h1>
      
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
          <label className="font-medium">Expenditure Type</label>
          <select
            className="border rounded px-2 py-1"
            name="expenditureType"
            value={form.expenditureType}
            onChange={handleChange}
          >
            <option value="personal">Personal Expenditures</option>
            <option value="other">Other Expenditures</option>
          </select>
        </div>

        {form.expenditureType === "personal" && (
          <div className="flex flex-col gap-1">
            <label className="font-medium">Expenditure</label>
            <input
              className="border rounded px-2 py-1"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter expenditure name"
            />
          </div>
        )}

        {form.expenditureType === "other" && (
          <div className="flex flex-col gap-1">
            <label className="font-medium">Liability</label>
            <select
              className="border rounded px-2 py-1"
              name="liabilityType"
              value={form.liabilityType}
              onChange={handleChange}
              required
            >
              <option value="">Select Liability</option>
              {liabilities.map((liability) => (
                <option key={liability.type} value={liability.type}>{liability.type}</option>
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
          <label className="font-medium">Type</label>
          <select
            className="border rounded px-2 py-1"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
          </select>
        </div>

        {form.type === "dynamic" && (
          <div className="flex flex-col gap-1">
            <label className="font-medium">State</label>
            <select
              className="border rounded px-2 py-1"
              name="state"
              value={form.state}
              onChange={handleChange}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700"
        >
          Add Expenditure
        </button>
      </form>

      <div className="w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 mb-6 flex flex-col gap-2">
          <div>Fixed Expenses: <span className="font-semibold">${essentialTotal.toFixed(2)}</span></div>
          <hr className="my-2 border-gray-300 dark:border-gray-700" />
          <div className="flex gap-4">
            <button
              className={`bg-orange-500 text-white rounded px-4 py-2 font-semibold transition-all duration-200 min-w-[160px] 
              hover:bg-orange-600 focus:bg-orange-600 hover:scale-105 focus:scale-105 active:scale-110 
              ${shownValue === "lean" ? "scale-110" : ""}`}
              onClick={() => setShownValue("lean")}
              type="button"
            >
              {shownValue === "lean" ? `$${tightTotal.toFixed(2)}` : "It's a Lean month"}
            </button>
            <button
              className={`bg-green-600 text-white rounded px-4 py-2 font-semibold transition-all duration-200 min-w-[160px] 
              hover:scale-105 focus:scale-105 active:scale-110 
              ${shownValue === "comfortable" ? "scale-110" : ""}`}
              onClick={() => setShownValue("comfortable")}
              type="button"
            >
              {shownValue === "comfortable" ? `$${lightTotal.toFixed(2)}` : "Financially comfortable"}
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-2">Expenditures</h2>
        {filteredExpenditures.length === 0 ? (
          <p className="text-gray-500">No expenditures added for this month yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredExpenditures.map((exp) => (
              <li key={exp.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium">
                    {exp.expenditureType === "personal" 
                      ? `Personal: ${exp.name}` 
                      : `Other: ${exp.liabilityType}`
                    }
                  </span>
                  <span>${exp.amount.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">{exp.type}</span>
                  {exp.type === "dynamic" && exp.state && (
                    <span className="text-xs text-gray-500">{exp.state}</span>
                  )}
                </div>
                <button
                  className="text-red-600 hover:underline text-xs"
                  onClick={() => handleRemove(exp.id)}
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