"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Search, Building2, Percent, Target, Info, ExternalLink, IndianRupee } from "lucide-react";
import Link from "next/link";

interface BankRecommendation {
  bank_name: string;
  interest_rate: number;
  beneficiaries: string;
  benefit_reason: string;
  hyperlink: string;
}

export default function LoanFinder() {
  const [loanType, setLoanType] = useState("Home Loan");
  const [amount, setAmount] = useState<string>("500000");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BankRecommendation[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      // Using relative path so it correctly maps to /api/loan-finder
      const response = await api.post("loan-finder", {
        loan_type: loanType,
        amount: parseFloat(amount),
      });
      setResults(response.data.banks);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch loan recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Smart Loan Finder
            </h1>
            <p className="text-foreground/60 mt-1">
              Find the top 10 best bank loans customized for your needs.
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            
            <div className="w-full md:w-1/3 space-y-2">
              <label className="text-sm font-medium text-foreground/80">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full p-3 rounded-xl glass-input transition-colors appearance-none"
              >
                <option value="Home Loan">Home Loan</option>
                <option value="Auto Loan">Auto Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Gold Loan">Gold Loan</option>
              </select>
            </div>

            <div className="w-full md:w-1/3 space-y-2">
              <label className="text-sm font-medium text-foreground/80">Amount Needed (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <input
                  type="number"
                  required
                  min="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input transition-colors"
                  placeholder="500000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-1/3 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-50"
            >
              {loading ? "Searching Banks..." : "Find Best Loans"}
              {!loading && <Search className="h-5 w-5" />}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger">
            {error}
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Top 10 Recommended Banks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {results.map((bank, index) => (
                <div key={index} className="glass-panel p-6 rounded-2xl flex flex-col hover:border-primary/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg">{bank.bank_name}</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-bold">
                      <Percent className="h-4 w-4" />
                      {bank.interest_rate}%
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground/80">Best For: </span>
                        <span className="text-foreground/60">{bank.beneficiaries}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm bg-background/30 p-3 rounded-lg border border-border/50">
                      <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-foreground/80 leading-relaxed italic">
                        "{bank.benefit_reason}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <a
                      href={bank.hyperlink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-background hover:bg-primary/10 border border-border/50 hover:border-primary/50 text-foreground py-2.5 rounded-xl font-medium transition-all"
                    >
                      Visit Bank Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
