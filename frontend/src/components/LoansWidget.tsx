import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Landmark } from "lucide-react";

export function LoansWidget() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [years, setYears] = useState("");
  const [interest, setInterest] = useState("");
  const [remaining, setRemaining] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await api.get("/ongoing-loans");
      setLoans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        principal_amount: parseFloat(principal),
        tenure_years: parseFloat(years),
        interest_rate: parseFloat(interest),
        remaining_amount: remaining ? parseFloat(remaining) : parseFloat(principal)
      };
      await api.post("/ongoing-loans", payload);
      setShowForm(false);
      setName("");
      setPrincipal("");
      setYears("");
      setInterest("");
      setRemaining("");
      fetchLoans();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ongoing-loans/${id}`);
      setLoans(loans.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="glass-panel p-6 rounded-3xl animate-pulse h-64"></div>;

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Ongoing Loans
          </h3>
          <p className="text-sm text-foreground/60 mt-1">Track your active liabilities.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 p-4 bg-foreground/5 rounded-2xl border border-foreground/10">
          <input 
            type="text" 
            placeholder="Loan Name (e.g. Home Loan)" 
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              placeholder="Principal (₹)" 
              required
              min="1"
              value={principal}
              onChange={e => setPrincipal(e.target.value)}
              className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
            />
            <input 
              type="number" 
              placeholder="Tenure (Years)" 
              required
              min="0.1"
              step="0.1"
              value={years}
              onChange={e => setYears(e.target.value)}
              className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
            />
            <input 
              type="number" 
              placeholder="Interest Rate (%)" 
              required
              min="0"
              step="0.1"
              value={interest}
              onChange={e => setInterest(e.target.value)}
              className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
            />
            <input 
              type="number" 
              placeholder="Remaining (₹) Optional" 
              min="0"
              value={remaining}
              onChange={e => setRemaining(e.target.value)}
              className="w-full bg-background border border-foreground/20 rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-white p-3 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Saving..." : "Add Loan"}
          </button>
        </form>
      )}

      {loans.length === 0 && !showForm && (
        <div className="text-center py-8 text-foreground/50 text-sm">
          No ongoing loans tracked.
        </div>
      )}

      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {loans.map(loan => {
          const progress = loan.remaining_amount != null 
            ? ((loan.principal_amount - loan.remaining_amount) / loan.principal_amount) * 100 
            : 0;
            
          return (
            <div key={loan.id} className="p-4 bg-background border border-foreground/10 rounded-2xl group hover:border-primary/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold">{loan.name}</h4>
                  <div className="text-xs text-foreground/60 mt-1 flex gap-3">
                    <span>{loan.tenure_years} Years</span>
                    <span>{loan.interest_rate}% Interest</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(loan.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger/10 rounded-full transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-foreground/50 mb-1">Remaining</div>
                  <div className="font-medium text-warning">
                    ₹{loan.remaining_amount?.toLocaleString() || loan.principal_amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground/50 mb-1">Principal</div>
                  <div className="font-medium">
                    ₹{loan.principal_amount.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {loan.remaining_amount != null && loan.remaining_amount < loan.principal_amount && (
                <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-success transition-all duration-1000" 
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
