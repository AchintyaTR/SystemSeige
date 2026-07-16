"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Wallet, CreditCard, PiggyBank, Activity, Save, TrendingUp } from "lucide-react";
import { GoalsWidget } from "@/components/GoalsWidget";
import { LoansWidget } from "@/components/LoansWidget";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [income, setIncome] = useState("");
  const [debt, setDebt] = useState("");
  const [savings, setSavings] = useState("");
  const [stocks, setStocks] = useState("");
  const [returns, setReturns] = useState("");
  const [savingStatus, setSavingStatus] = useState("");
  const [monthExpense, setMonthExpense] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/profile");
        setProfile(data);
        setIncome(data.monthly_income?.toString() || "0");
        setDebt(data.total_debt?.toString() || "0");
        setSavings(data.savings?.toString() || "0");
        setStocks(data.stock_holdings_value?.toString() || "0");
        setReturns(data.average_return_pct?.toString() || "0");
        
        // Fetch current month expenses
        try {
          const expRes = await api.get("/expenses");
          const now = new Date();
          const thisMonth = expRes.data.filter((e: any) => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          const total = thisMonth.reduce((sum: number, e: any) => sum + e.amount, 0);
          setMonthExpense(total);
        } catch (e) {
          // ignore
        }
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus("Saving...");
    try {
      const { data } = await api.put("/profile", {
        monthly_income: parseFloat(income),
        total_debt: parseFloat(debt),
        savings: parseFloat(savings),
        stock_holdings_value: parseFloat(stocks),
        average_return_pct: parseFloat(returns)
      });
      setProfile(data);
      setSavingStatus("Saved successfully!");
      setTimeout(() => setSavingStatus(""), 3000);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      } else {
        setSavingStatus("Error saving profile.");
      }
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading dashboard...</div>;
  }

  if (!profile) return null;

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Financial Dashboard</h1>
        <p className="text-foreground/60">Overview of your financial health and profile.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Col: Health Score */}
        <div className="space-y-8">
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
            <h3 className="text-xl font-medium mb-6 relative z-10 text-foreground/80">Financial Health Score</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[12px] border-white/5 z-10 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
              <div 
                className="absolute inset-0 rounded-full border-[12px] border-primary"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${profile.financial_health_score}%, 0 ${profile.financial_health_score}%)`
                }}
              />
              <div className="text-center">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  {profile.financial_health_score}
                </span>
                <span className="block text-sm text-foreground/60 mt-1">/ 100</span>
              </div>
            </div>
            
            <div className="w-full mt-8 p-4 bg-foreground/5 rounded-2xl border border-foreground/10 text-center">
              <div className="text-sm text-foreground/60 mb-1">Current Month Expenses</div>
              <div className="text-3xl font-bold text-danger">₹{monthExpense.toLocaleString()}</div>
            </div>
          </div>
          
          <GoalsWidget />
          <LoansWidget />
        </div>

        {/* Right Col: Update Form */}
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Update Profile</h3>
            {savingStatus && (
              <span className={`text-sm ${savingStatus.includes("Error") ? "text-danger" : "text-success"}`}>
                {savingStatus}
              </span>
            )}
          </div>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Monthly Income (₹)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <input 
                  type="number" 
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Total Debt (₹)</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <input 
                  type="number" 
                  value={debt}
                  onChange={(e) => setDebt(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Total Savings (₹)</label>
              <div className="relative">
                <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <input 
                  type="number" 
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Stock Holdings (₹)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                  <input 
                    type="number" 
                    value={stocks}
                    onChange={(e) => setStocks(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Avg Return (%)</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                  <input 
                    type="number" 
                    value={returns}
                    onChange={(e) => setReturns(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-all"
            >
              <Save className="h-5 w-5" />
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
