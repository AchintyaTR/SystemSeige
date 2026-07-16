"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Plus, Receipt, History, AlertCircle } from "lucide-react";

export default function ExpenseTracker() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Emergency");
  const [description, setDescription] = useState("");

  const categories = ["Emergency", "Leisure", "Family", "Groceries", "Rent", "Utilities", "Other"];

  useEffect(() => {
    fetchExpenses();
  }, [router]);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get("/expenses");
      setExpenses(data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    try {
      const { data } = await api.post("/expenses", {
        amount: parseFloat(amount),
        category,
        description
      });
      setExpenses([data, ...expenses]);
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError("Failed to add expense.");
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading tracker...</div>;
  }

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Expense Tracker</h1>
        <p className="text-foreground/60">Log your daily expenses and categorize them for better insights.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> New Expense
            </h3>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Amount (₹)</label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input appearance-none bg-background/50"
                >
                  {categories.map(c => <option key={c} value={c} className="bg-background text-foreground">{c}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Description (Optional)</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input"
                  placeholder="Dinner, Movie, etc."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors mt-2"
              >
                Log Expense
              </button>
            </form>
          </div>
        </div>

        {/* Expense History */}
        <div className="md:col-span-2">
          <div className="glass-panel p-6 rounded-3xl h-full">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History className="h-5 w-5 text-accent" /> Recent Activity
            </h3>
            
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-foreground/50 italic">
                <Receipt className="h-12 w-12 mb-4 opacity-20" />
                No expenses logged yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-between hover:bg-foreground/10 transition-colors">
                    <div>
                      <div className="font-semibold">{exp.category}</div>
                      <div className="text-sm text-foreground/60">{exp.description || "No description"}</div>
                      <div className="text-xs text-foreground/50 mt-1">{new Date(exp.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xl font-bold text-danger">
                      -₹{exp.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
