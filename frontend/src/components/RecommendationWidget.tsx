"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Lightbulb, Loader2, TrendingUp } from "lucide-react";

export function RecommendationWidget() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getRecommendations = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/recommendation");
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" /> Improve Your Score
        </h3>
        {recommendations.length > 0 && (
          <button 
            onClick={getRecommendations}
            disabled={loading}
            className="p-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-full transition-colors disabled:opacity-50"
            title="Refresh Recommendations"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
        {error && (
          <div className="text-center text-danger text-sm py-2">
            {error}
          </div>
        )}

        {recommendations.length === 0 && !loading && !error ? (
          <div className="text-center py-8">
            <p className="text-foreground/60 text-sm mb-4">Want to know how to improve your financial health score?</p>
            <button 
              onClick={getRecommendations}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Get AI Recommendations
            </button>
          </div>
        ) : loading && recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-primary animate-pulse space-y-4">
            <Lightbulb className="h-8 w-8" />
            <p className="text-sm font-medium">Analyzing your finances...</p>
          </div>
        ) : (
          recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-primary">{rec.title}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  rec.impact === 'High' ? 'bg-success/20 text-success' : 
                  rec.impact === 'Medium' ? 'bg-warning/20 text-warning' : 
                  'bg-foreground/10 text-foreground'
                }`}>
                  {rec.impact} Impact
                </span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">
                {rec.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
