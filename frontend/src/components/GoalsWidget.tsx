"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Plus, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function GoalsWidget() {
  const router = useRouter();
  const [goals, setGoals] = useState<any[]>([]);
  
  // New goal form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await api.get("/goals");
      setGoals(data);
    } catch (err) {
      console.error("Failed to fetch goals");
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;
    
    try {
      const { data } = await api.post("/goals", {
        name,
        target_amount: parseFloat(target),
        current_amount: parseFloat(current) || 0
      });
      setGoals([data, ...goals]);
      setShowForm(false);
      setName("");
      setTarget("");
      setCurrent("");
    } catch (err) {
      console.error("Failed to add goal");
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" /> Current Goals
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-full transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddGoal} className="mb-6 space-y-3 p-4 bg-foreground/5 rounded-xl border border-foreground/10">
          <input 
            type="text" placeholder="Goal Name (e.g. Buy a Car)" required
            value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg glass-input"
          />
          <div className="flex gap-3">
            <input 
              type="number" placeholder="Target (₹)" required
              value={target} onChange={e => setTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg glass-input"
            />
            <input 
              type="number" placeholder="Current (₹)"
              value={current} onChange={e => setCurrent(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg glass-input"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-2 text-sm rounded-lg font-medium">
            Save Goal
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
        {goals.length === 0 && !showForm ? (
          <div className="text-center text-foreground/50 italic py-8 text-sm">
            No goals set. Click + to add one.
          </div>
        ) : (
          goals.map(goal => {
            const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            return (
              <Link href={`/goals/${goal.id}`} key={goal.id} className="block group">
                <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 group-hover:bg-foreground/10 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm">{goal.name}</span>
                    <span className="text-xs font-medium text-foreground/60">
                      ₹{goal.current_amount.toLocaleString('en-IN')} / ₹{goal.target_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="h-3 w-3" /> Get LLM Advice for this Goal &rarr;
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
