"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { UploadCloud, FileText, AlertTriangle, ShieldCheck, Info } from "lucide-react";

export default function LoanScanner() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/profile");
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/login");
        }
      }
    };
    checkAuth();
  }, [router]);

  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        setFile(null);
        return;
      }
      setFile(selected);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_language", targetLanguage);

    try {
      const { data } = await api.post("/loans/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
      } else {
        setError(err.response?.data?.detail || "Failed to analyze loan. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Predatory Loan Scanner</h1>
        <p className="text-foreground/60">Upload your loan agreement to detect hidden fees and verify EMI mathematically.</p>
      </div>

      {!result ? (
        <div className="glass-panel p-12 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center space-y-6">
          <div className="p-6 bg-primary/10 rounded-full">
            <UploadCloud className="h-12 w-12 text-primary" />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-medium mb-1">Upload Loan Agreement</h3>
            <p className="text-sm text-foreground/60">PDF up to 5MB</p>
          </div>

          <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-medium transition-colors">
            Select File
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </label>

          <div className="flex flex-col items-center gap-2 mt-4">
            <span className="text-sm text-foreground/60">Explanation Language</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-center cursor-pointer min-w-[150px]"
            >
              <option value="English" className="bg-background text-foreground">English</option>
              <option value="Hindi" className="bg-background text-foreground">Hindi</option>
              <option value="Spanish" className="bg-background text-foreground">Spanish</option>
              <option value="French" className="bg-background text-foreground">French</option>
              <option value="German" className="bg-background text-foreground">German</option>
              <option value="Tamil" className="bg-background text-foreground">Tamil</option>
              <option value="Telugu" className="bg-background text-foreground">Telugu</option>
            </select>
          </div>

          {file && (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg w-full max-w-md mt-4">
              <FileText className="h-6 w-6 text-primary" />
              <div className="flex-1 truncate text-sm">{file.name}</div>
              <button 
                onClick={handleUpload}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Scanning..." : "Analyze"}
              </button>
            </div>
          )}

          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            {/* Deterministic Fairness Score */}
            <div className={`absolute top-0 left-0 w-full h-2 ${
              result.fairness_score >= 80 ? "bg-success" : 
              result.fairness_score >= 50 ? "bg-warning" : "bg-danger"
            }`} />
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  {result.fairness_score >= 80 ? (
                    <ShieldCheck className="h-8 w-8 text-success" />
                  ) : (
                    <AlertTriangle className={`h-8 w-8 ${result.fairness_score >= 50 ? "text-warning" : "text-danger"}`} />
                  )}
                  <h2 className="text-3xl font-bold">Analysis Complete</h2>
                </div>
                <p className="text-xl text-foreground/80 bg-white/5 p-4 rounded-xl italic">
                  "{result.explanation}"
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-full w-48 h-48 border-4 border-white/10 shadow-2xl">
                <span className="text-sm text-foreground/60 font-medium uppercase tracking-wider mb-1">Fairness Score</span>
                <span className={`text-6xl font-extrabold ${
                  result.fairness_score >= 80 ? "text-success" : 
                  result.fairness_score >= 50 ? "text-warning" : "text-danger"
                }`}>
                  {result.fairness_score}
                </span>
                <span className="text-sm text-foreground/50">/ 100</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl space-y-2">
              <div className="text-sm text-foreground/60 flex items-center gap-2">
                <Info className="h-4 w-4" /> Principal
              </div>
              <div className="text-2xl font-semibold">₹{result.principal?.toLocaleString('en-IN')}</div>
            </div>
            <div className="glass-panel p-6 rounded-xl space-y-2">
              <div className="text-sm text-foreground/60 flex items-center gap-2">
                <Info className="h-4 w-4" /> Stated EMI
              </div>
              <div className="text-2xl font-semibold">₹{result.stated_emi?.toLocaleString('en-IN')}</div>
            </div>
            <div className="glass-panel p-6 rounded-xl space-y-2">
              <div className="text-sm text-foreground/60 flex items-center gap-2">
                <Info className="h-4 w-4" /> Verified EMI
              </div>
              <div className="text-2xl font-semibold">₹{result.verified_emi?.toLocaleString('en-IN')}</div>
              {result.emi_deviation_pct > 0 && (
                <div className="text-xs text-danger font-medium mt-1">
                  Deviation: {result.emi_deviation_pct.toFixed(2)}%
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-8">
            <button 
              onClick={() => { setResult(null); setFile(null); }}
              className="text-primary hover:text-primary-foreground font-medium transition-colors"
            >
              Scan Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
