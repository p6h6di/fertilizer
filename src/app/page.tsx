import { NavAuthButtons, HeroCTA, CTAButton } from "@/components/auth-buttons";
import {
  FlaskConical,
  Bug,
  CloudSun,
  MessageSquare,
  BarChart2,
  Zap,
  Globe,
  Shield,
  Cpu,
  Droplets,
  CheckCircle,
  Leaf,
} from "lucide-react";


const features = [
  {
    icon: FlaskConical,
    title: "Fertilizer Recommendation",
    description:
      "AI-driven fertilizer suggestions based on soil type, pH, NPK levels, crop stage, and season for optimal nutrient supply.",
  },
  {
    icon: Leaf,
    title: "Crop Recommendation",
    description:
      "AI-powered crop suggestions based on soil parameters, rainfall, temperature, and available nutrients for maximum yield.",
  },
  {
    icon: Bug,
    title: "Disease Detection",
    description:
      "Upload plant images for instant AI-powered disease diagnosis with treatment plans and prevention tips.",
  },
  {
    icon: MessageSquare,
    title: "Multilingual Chatbot",
    description:
      "Get fertilizer and farming advice in 8 Indian languages including Hindi, Tamil, Telugu, Bengali, Marathi, Punjabi, and Gujarati.",
  },
  {
    icon: CloudSun,
    title: "Weather Advisory",
    description:
      "Real-time weather data with 5-day forecasts and AI-generated fertilizer application advisories based on local conditions.",
  },
  {
    icon: BarChart2,
    title: "Data Insights",
    description:
      "Track fertilizer usage, crop history, disease detections, and chat sessions with detailed analytics and reports.",
  },
  {
    icon: Zap,
    title: "Real-Time Assistance",
    description:
      "Instant AI responses for nutrient deficiency, fertilizer dosage, irrigation schedules, and market price guidance.",
  },
  {
    icon: Globe,
    title: "Location Intelligence",
    description:
      "GPS-based fertilizer and crop recommendations tailored to your exact farm location for hyper-local advice.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your farm and soil data is encrypted and secure. Full control over your agricultural records.",
  },
  {
    icon: Cpu,
    title: "ML-Powered Engine",
    description:
      "Backed by machine learning models trained on extensive Indian agricultural and soil datasets for high accuracy.",
  },
  {
    icon: Droplets,
    title: "Fertigation Planning",
    description:
      "Smart fertigation scheduling combining fertilizer and irrigation based on crop requirements and soil moisture.",
  },
];

const stats = ["10,000+ Farmers", "8 Indian Languages", "95% Accuracy Rate", "30% Fertilizer Savings"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <FlaskConical className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">FertiSmart</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How It Works", "Get Started"].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <NavAuthButtons />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-125 h-125 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-125 h-125 bg-accent/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Fertilizer Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
            Smart Fertilization,{" "}
            <span className="text-primary">Powered by AI</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Empowering Indian farmers with fertilizer recommendations, crop planning, instant disease diagnosis,
            real-time weather advisories, and multilingual AI assistance — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <HeroCTA />
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {stats.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Everything a Modern Farmer Needs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From fertilizer planning to weather forecasting, FertiSmart brings the power of AI
              directly to your farm.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-secondary group-hover:bg-primary rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-200" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-muted-foreground">Three simple steps to smarter farming</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Sign up in seconds and set your farm location, preferred language, and crop preferences.",
              },
              {
                step: "02",
                title: "Input Your Farm Data",
                desc: "Enter soil parameters, upload plant images, or simply ask questions in your native language.",
              },
              {
                step: "03",
                title: "Get AI Recommendations",
                desc: "Receive personalized crop plans, disease treatments, and weather-based farming advice instantly.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center group">
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 text-lg font-bold shadow-md group-hover:scale-105 transition-transform">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px border-t-2 border-dashed border-border" />
                )}
                <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="py-24 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            Join thousands of farmers already using FertiSmart to optimize fertilizer use, increase yields,
            and farm more sustainably.
          </p>
          <CTAButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[oklch(0.22_0.03_65)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-white font-bold">FertiSmart</span>
            </div>
            <p className="text-sm text-white/60">AI-Powered Fertilizer & Farming Assistant for Indian Agriculture</p>
            <p className="text-sm text-white/60">&copy; {new Date().getFullYear()} FertiSmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
