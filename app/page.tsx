"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

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

  useEffect(() => {
    // Get totals from localStorage (default to 0 if not found)
    const incomeRaw = localStorage.getItem("incomes");
    const expenditureRaw = localStorage.getItem("expenditures");
    const assetsRaw = localStorage.getItem("assets");
    const liabilitiesRaw = localStorage.getItem("liabilities");
    
    let totalIncome = 0;
    let totalExpenditure = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    if (incomeRaw) {
      try {
        const incomes = JSON.parse(incomeRaw);
        // Filter incomes by selected year and month
        const filteredIncomes = incomes.filter((inc: any) => 
          inc.year === selectedYear && inc.month === selectedMonth
        );
        totalIncome = filteredIncomes.reduce((sum: number, inc: any) => sum + (inc.amount || 0), 0);
      } catch {}
    }
    if (expenditureRaw) {
      try {
        const expenditures = JSON.parse(expenditureRaw);
        // Filter expenditures by selected year and month
        const filteredExpenditures = expenditures.filter((exp: any) => 
          exp.year === selectedYear && exp.month === selectedMonth
        );
        totalExpenditure = filteredExpenditures.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
      } catch {}
    }
    if (assetsRaw) {
      try {
        const assets = JSON.parse(assetsRaw);
        totalAssets = assets.reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);
      } catch {}
    }
    if (liabilitiesRaw) {
      try {
        const liabilities = JSON.parse(liabilitiesRaw);
        totalLiabilities = liabilities.reduce((sum: number, liability: any) => sum + (liability.amount || 0), 0);
      } catch {}
    }
    
    setBalance(totalIncome - totalExpenditure);
    setTotalAssets(totalAssets);
    setTotalLiabilities(totalLiabilities);
    setNetWorth(totalAssets - totalLiabilities);
  }, [selectedYear, selectedMonth]);

  const getBalanceColor = () => {
    if (balance < 0) return "from-red-500 to-red-600";
    if (balance > 0) return "from-green-500 to-green-600";
    return "from-gray-500 to-gray-600";
  };

  const getBalanceTextColor = () => {
    if (balance < 0) return "text-red-100";
    if (balance > 0) return "text-green-100";
    return "text-gray-100";
  };

  const getBalanceIcon = () => {
    if (balance < 0) return "📉";
    if (balance > 0) return "📈";
    return "➖";
  };

  const getNetWorthIcon = () => {
    if (netWorth < 0) return "💸";
    if (netWorth > 0) return "💰";
    return "💳";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Track your financial health and wealth
          </p>
        </div>

        {/* Year and Month Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              📅
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Time Period</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Balance Card */}
          <div className={`bg-gradient-to-br ${getBalanceColor()} rounded-3xl shadow-xl p-8 text-white transform hover:scale-105 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                {getBalanceIcon()}
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Monthly</div>
                <div className="text-xs opacity-75">Cash Flow</div>
              </div>
            </div>
            <div className="mb-2">
              <h3 className="text-lg font-medium opacity-90">Current Balance</h3>
            </div>
            <div className={`text-4xl font-bold ${getBalanceTextColor()} mb-2`}>
              ${balance.toFixed(2)}
            </div>
            <div className="text-sm opacity-75">
              {balance < 0 ? "Negative cash flow" : balance > 0 ? "Positive cash flow" : "Neutral cash flow"}
            </div>
          </div>

          {/* Net Worth Card */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-xl p-8 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                {getNetWorthIcon()}
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Total</div>
                <div className="text-xs opacity-75">Net Worth</div>
              </div>
            </div>
            <div className="mb-2">
              <h3 className="text-lg font-medium opacity-90">How Rich I Am</h3>
            </div>
            <div className="text-4xl font-bold text-orange-100 mb-2">
              ${netWorth.toFixed(2)}
            </div>
            <div className="text-sm opacity-75">
              {netWorth < 0 ? "Negative net worth" : netWorth > 0 ? "Positive net worth" : "Zero net worth"}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                💰
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Assets</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total value</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalAssets.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Liabilities</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total debt</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalLiabilities.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                📈
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Status</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Financial health</p>
              </div>
            </div>
            <div className={`text-lg font-semibold ${
              netWorth > 0 ? 'text-green-600 dark:text-green-400' : 
              netWorth < 0 ? 'text-red-600 dark:text-red-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>
              {netWorth > 0 ? 'Healthy' : netWorth < 0 ? 'Needs Attention' : 'Neutral'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
