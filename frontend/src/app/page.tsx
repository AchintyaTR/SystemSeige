import Link from "next/link";
import { ShieldAlert, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] md:leading-[1.1]">
          Secure your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Financial Future
          </span>
        </h1>
        
        <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
          AI-powered financial wellness and loan transparency platform. 
          Get comprehensive advice from a virtual board of directors and detect predatory loans before you sign.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105"
          >
            Get Started <ArrowRight className="h-5 w-5 text-white" />
          </Link>
          <Link
            href="/scanner"
            className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-8 py-4 rounded-xl font-medium transition-all border border-foreground/10 hover:border-foreground/20"
          >
            Try Loan Scanner
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-primary/20 rounded-full text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Predatory Loan Scanner</h3>
          <p className="text-foreground/60">
            Upload your loan document and instantly detect hidden fees, excessive rates, and compliance risks.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-accent/20 rounded-full text-accent">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Personal AI Financial Advisor</h3>
          <p className="text-foreground/60">
            Chat with a specialized personal financial advisor for comprehensive wealth planning.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-success/20 rounded-full text-success">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Bank-Grade Security</h3>
          <p className="text-foreground/60">
            Secure by default with robust rate limiting, encrypted JWT auth, and strict data isolation.
          </p>
        </div>
      </div>
    </div>
  );
}
