"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { use } from "react";
import { Target, Bot, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function GoalDetails({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const goalId = unwrappedParams.id;
  
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      const { data } = await api.get(`/goals/${goalId}`);
      setGoal(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdvice = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/goals/${goalId}/advice`);
      setGoal(data);
    } catch (err) {
      console.error("Failed to generate advice");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading goal...</div>;
  if (!goal) return <div className="flex-1 flex items-center justify-center">Goal not found.</div>;

  const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
      <Link href="/dashboard" className="text-foreground/60 hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-accent/20 rounded-full">
            <Target className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{goal.name}</h1>
            <p className="text-foreground/60 text-sm">Created on {new Date(goal.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-foreground/60">Progress</span>
            <span>₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-background rounded-full h-4 overflow-hidden border border-foreground/10">
            <div 
              className="bg-accent h-4 rounded-full transition-all duration-1000" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" /> AI Financial Plan
          </h3>
          {!goal.llm_advice_json && (
            <button 
              onClick={handleGenerateAdvice}
              disabled={generating}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {generating ? "Analyzing Profile..." : "Generate Custom Plan"}
            </button>
          )}
        </div>

        {!goal.llm_advice_json && !generating && (
          <div className="text-center py-12 text-foreground/60 border border-dashed border-foreground/20 rounded-xl">
            <p>You haven't generated a plan for this goal yet.</p>
            <p className="text-sm mt-2">Our AI will analyze your income, debts, savings, stock holdings, and expenses to give you a personalized roadmap.</p>
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center justify-center py-12 text-primary animate-pulse space-y-4">
            <Bot className="h-12 w-12" />
            <p className="text-sm font-medium">Consulting the board of directors...</p>
          </div>
        )}

        {goal.llm_advice_json && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-background/50 p-6 rounded-2xl border border-foreground/10 italic text-foreground/80">
              "{goal.llm_advice_json.summary}"
            </div>
            
            <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-4 py-2 rounded-full text-sm font-bold">
              ⏱ Estimated Timeline: {goal.llm_advice_json.estimated_months} months
            </div>

            <div className="space-y-4 mt-6">
              <h4 className="font-bold text-lg">Action Plan</h4>
              {goal.llm_advice_json.steps?.map((step: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors">
                  <div className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold mb-1">{step.title}</div>
                    <div className="text-sm text-foreground/60 leading-relaxed">{step.description}</div>
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
