import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Ruler,
    Camera,
    Target,
    Zap,
    CheckCircle2,
    ArrowRight,
    BarChart3,
    Shield,
    Clock,
    Code2,
    ChevronDown,
    Eye,
    Cpu,
    Layers,
    TrendingUp,
    Award,
    Phone,
    Mail,
    MapPin,
} from 'lucide-react';

// Hook for scroll-triggered animations
function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

// Animated counter component
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, isVisible } = useInView();
    const numericTarget = parseInt(target.replace(/[^0-9]/g, '')) || 0;

    useEffect(() => {
        if (!isVisible || numericTarget === 0) return;
        let current = 0;
        const increment = numericTarget / 40;
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericTarget) {
                setCount(numericTarget);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 30);
        return () => clearInterval(timer);
    }, [isVisible, numericTarget]);

    return <span ref={ref}>{count}{suffix}</span>;
}

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [scrollY, setScrollY] = useState(0);
    const [navSolid, setNavSolid] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            setNavSolid(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const section1 = useInView();
    const section2 = useInView();
    const section3 = useInView();
    const section4 = useInView();

    return (
        <>
            <Head title="MagicQC - Intelligent Quality Assurance">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800,900&family=space-grotesk:400,500,600,700" rel="stylesheet" />
                <style>{`
                    .font-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
                    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
                    @keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
                    @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes slide-in-left { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes slide-in-right { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes scale-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
                    @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                    .animate-float { animation: float 6s ease-in-out infinite; }
                    .animate-float-delay { animation: float 6s ease-in-out 2s infinite; }
                    .animate-float-delay-2 { animation: float 6s ease-in-out 4s infinite; }
                    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
                    .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
                    .animate-slide-up-delay { animation: slide-up 0.8s ease-out 0.2s forwards; opacity: 0; }
                    .animate-slide-up-delay-2 { animation: slide-up 0.8s ease-out 0.4s forwards; opacity: 0; }
                    .animate-slide-up-delay-3 { animation: slide-up 0.8s ease-out 0.6s forwards; opacity: 0; }
                    .animate-slide-in-left { animation: slide-in-left 0.8s ease-out forwards; }
                    .animate-slide-in-right { animation: slide-in-right 0.8s ease-out forwards; }
                    .animate-scale-in { animation: scale-in 0.6s ease-out forwards; }
                    .gradient-animate { background-size: 200% 200%; animation: gradient-shift 4s ease infinite; }
                    .glass { background: rgba(255,255,255,0.08); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); }
                    .glass-dark { background: rgba(0,0,0,0.2); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
                `}</style>
            </Head>

            <div className="min-h-screen bg-[#0a0f1a] text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* Navigation */}
                <header
                    className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${navSolid
                        ? 'bg-[#0a0f1a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20'
                        : 'bg-transparent'
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <nav className="flex items-center justify-between">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <img
                                    src="/MagicQC logo.png"
                                    alt="MagicQC"
                                    className="h-10 w-auto brightness-0 invert"
                                />
                            </div>

                            {/* Center Nav Links */}
                            <div className="hidden md:flex items-center gap-8">
                                {['Features', 'How It Works', 'Results', 'Contact'].map((item) => (
                                    <a
                                        key={item}
                                        href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                        className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-300 relative group"
                                    >
                                        {item}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#f7a536] to-[#e8563f] group-hover:w-full transition-all duration-300" />
                                    </a>
                                ))}
                            </div>

                            {/* Login Button */}
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7a536] to-[#e8563f] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#f7a536]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#f7a536]/30 hover:scale-105"
                                    >
                                        Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/system-login"
                                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7a536] to-[#e8563f] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#f7a536]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#f7a536]/30 hover:scale-105"
                                    >
                                        Sign In
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0">
                        <div
                            className="absolute top-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-[#264c59]/20 blur-[120px] animate-pulse-glow"
                            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
                        />
                        <div
                            className="absolute bottom-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-[#f7a536]/10 blur-[100px] animate-pulse-glow"
                            style={{ transform: `translateY(${scrollY * -0.08}px)`, animationDelay: '1.5s' }}
                        />
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[#1a2d3d]/30 blur-[150px]"
                        />
                        {/* Grid pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '60px 60px',
                            }}
                        />
                    </div>

                    {/* Floating geometric shapes */}
                    <div className="absolute top-32 left-[10%] w-16 h-16 border border-[#f7a536]/20 rounded-lg rotate-12 animate-float" />
                    <div className="absolute top-48 right-[15%] w-10 h-10 border border-[#264c59]/30 rounded-full animate-float-delay" />
                    <div className="absolute bottom-32 left-[20%] w-12 h-12 bg-gradient-to-br from-[#f7a536]/10 to-transparent rounded-lg rotate-45 animate-float-delay-2" />
                    <div className="absolute bottom-48 right-[10%] w-20 h-20 border border-white/5 rounded-2xl -rotate-12 animate-float" />

                    <div className="relative max-w-7xl mx-auto px-6 text-center">
                        {/* Badge */}
                        <div className="animate-slide-up inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-medium text-[#f7a536] mb-8">
                            <Zap className="h-4 w-4" />
                            Intelligent Quality Assurance Platform
                        </div>

                        {/* Main Heading */}
                        <h1 className="animate-slide-up-delay font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
                            Where{' '}
                            <span className="bg-gradient-to-r from-[#f7a536] via-[#e8563f] to-[#f7a536] bg-clip-text text-transparent gradient-animate">
                                Precision
                            </span>
                            <br />
                            Meets Confidence
                        </h1>

                        {/* Subtitle */}
                        <p className="animate-slide-up-delay-2 text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Advanced vision intelligence for automated measurement and quality verification.
                            Faster decisions, reliable results, every single time.
                        </p>

                        {/* CTA Buttons */}
                        <div className="animate-slide-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!auth.user && (
                                <Link
                                    href="/system-login"
                                    className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#f7a536] to-[#e8563f] px-10 py-4 text-base font-semibold text-white shadow-2xl shadow-[#f7a536]/25 transition-all duration-300 hover:shadow-3xl hover:shadow-[#f7a536]/40 hover:scale-105"
                                >
                                    Get Started
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            )}
                            <a
                                href="#features"
                                className="group inline-flex items-center gap-3 rounded-full glass px-8 py-4 text-base font-medium text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
                            >
                                Explore Features
                                <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
                            </a>
                        </div>

                        {/* Scroll indicator */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
                            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                                <div className="w-1.5 h-3 rounded-full bg-white/40 animate-bounce" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-8 relative">
                    <div className="max-w-6xl mx-auto px-6">
                        <div
                            ref={section1.ref}
                            className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-1000 ${section1.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            {[
                                { value: '99', suffix: '%', label: 'Measurement Accuracy', icon: Target },
                                { value: '10', suffix: 'x', label: 'Faster Than Manual', icon: Clock },
                                { value: '500', suffix: '+', label: 'Inspections Daily', icon: Ruler },
                                { value: '24', suffix: '/7', label: 'Real-time Monitoring', icon: Shield },
                            ].map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className="group glass rounded-2xl p-6 text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#f7a536]/5"
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7a536]/20 to-[#e8563f]/10 transition-all duration-300 group-hover:scale-110">
                                        <stat.icon className="h-5 w-5 text-[#f7a536]" />
                                    </div>
                                    <div className="font-display text-3xl font-bold text-white mb-1">
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                    </div>
                                    <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="max-w-7xl mx-auto px-6">
                        <div
                            ref={section2.ref}
                            className={`text-center mb-20 transition-all duration-1000 ${section2.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-medium text-[#f7a536] mb-6">
                                <Layers className="h-4 w-4" />
                                Core Capabilities
                            </div>
                            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                                Built for{' '}
                                <span className="bg-gradient-to-r from-[#f7a536] to-[#e8563f] bg-clip-text text-transparent">
                                    Excellence
                                </span>
                            </h2>
                            <p className="text-lg text-white/40 max-w-2xl mx-auto">
                                A comprehensive quality assurance platform designed to streamline your inspection workflow from start to finish
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: Eye,
                                    title: 'Intelligent Vision',
                                    description: 'Advanced imaging technology that automatically identifies measurement points with sub-millimeter precision.',
                                    gradient: 'from-blue-500/20 to-cyan-500/20',
                                    iconColor: 'text-blue-400',
                                    borderColor: 'hover:border-blue-500/30',
                                },
                                {
                                    icon: Cpu,
                                    title: 'Smart Processing',
                                    description: 'Real-time analysis engine that processes measurements instantly, delivering results in seconds not minutes.',
                                    gradient: 'from-violet-500/20 to-purple-500/20',
                                    iconColor: 'text-violet-400',
                                    borderColor: 'hover:border-violet-500/30',
                                },
                                {
                                    icon: Ruler,
                                    title: 'Precise Measurement',
                                    description: 'Automated dimension verification with configurable tolerances and instant pass/fail determination.',
                                    gradient: 'from-amber-500/20 to-orange-500/20',
                                    iconColor: 'text-amber-400',
                                    borderColor: 'hover:border-amber-500/30',
                                },
                                {
                                    icon: BarChart3,
                                    title: 'Live Analytics',
                                    description: 'Comprehensive dashboards with production counters, trend analysis, and exportable quality reports.',
                                    gradient: 'from-emerald-500/20 to-green-500/20',
                                    iconColor: 'text-emerald-400',
                                    borderColor: 'hover:border-emerald-500/30',
                                },
                                {
                                    icon: Shield,
                                    title: 'Quality Assurance',
                                    description: 'End-to-end traceability linking every measurement to its source for complete compliance and audit readiness.',
                                    gradient: 'from-rose-500/20 to-pink-500/20',
                                    iconColor: 'text-rose-400',
                                    borderColor: 'hover:border-rose-500/30',
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Scalable Operations',
                                    description: 'From single-station setups to multi-facility deployments — scales effortlessly with your production needs.',
                                    gradient: 'from-cyan-500/20 to-teal-500/20',
                                    iconColor: 'text-cyan-400',
                                    borderColor: 'hover:border-cyan-500/30',
                                },
                            ].map((feature, i) => (
                                <div
                                    key={feature.title}
                                    className={`group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.05] ${feature.borderColor}`}
                                    style={{
                                        opacity: section2.isVisible ? 1 : 0,
                                        transform: section2.isVisible ? 'translateY(0)' : 'translateY(30px)',
                                        transition: `all 0.6s ease-out ${i * 0.1}s`,
                                    }}
                                >
                                    {/* Glow effect on hover */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`} />

                                    <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} transition-transform duration-300 group-hover:scale-110`}>
                                        <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                                    </div>
                                    <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors duration-300">
                                        {feature.title}
                                    </h3>
                                    <p className="text-white/40 leading-relaxed group-hover:text-white/60 transition-colors duration-300">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-32 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#264c59]/5 to-transparent" />

                    <div className="relative max-w-7xl mx-auto px-6">
                        <div
                            ref={section3.ref}
                            className={`text-center mb-20 transition-all duration-1000 ${section3.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-medium text-[#f7a536] mb-6">
                                <Zap className="h-4 w-4" />
                                Simple Workflow
                            </div>
                            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                                Three Steps to{' '}
                                <span className="bg-gradient-to-r from-[#f7a536] to-[#e8563f] bg-clip-text text-transparent">
                                    Perfect Quality
                                </span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    step: '01',
                                    title: 'Capture',
                                    description: 'Place the item on the surface. The system captures a high-resolution image automatically.',
                                    icon: Camera,
                                },
                                {
                                    step: '02',
                                    title: 'Measure',
                                    description: 'Intelligent vision technology identifies key measurement points and calculates precise dimensions in real-time.',
                                    icon: Target,
                                },
                                {
                                    step: '03',
                                    title: 'Report',
                                    description: 'Instant pass/fail results with detailed measurement data, trend analysis, and exportable quality reports.',
                                    icon: CheckCircle2,
                                },
                            ].map((item, i) => (
                                <div
                                    key={item.step}
                                    className="group relative"
                                    style={{
                                        opacity: section3.isVisible ? 1 : 0,
                                        transform: section3.isVisible ? 'translateY(0)' : 'translateY(40px)',
                                        transition: `all 0.8s ease-out ${i * 0.2}s`,
                                    }}
                                >
                                    {/* Connector line */}
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#f7a536]/30 to-transparent" />
                                    )}

                                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-500 hover:-translate-y-3 hover:bg-white/[0.05] hover:border-[#f7a536]/20">
                                        {/* Step number */}
                                        <div className="font-display text-6xl font-bold text-white/[0.04] absolute top-4 right-6 transition-all duration-300 group-hover:text-[#f7a536]/10">
                                            {item.step}
                                        </div>

                                        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7a536]/20 to-[#e8563f]/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#f7a536]/20">
                                            <item.icon className="h-7 w-7 text-[#f7a536]" />
                                        </div>

                                        <h3 className="font-display text-2xl font-bold text-white mb-3">{item.title}</h3>
                                        <p className="text-white/40 leading-relaxed group-hover:text-white/60 transition-colors duration-300">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Comparison Section */}
                <section id="results" className="py-32 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="max-w-5xl mx-auto px-6">
                        <div
                            ref={section4.ref}
                            className={`transition-all duration-1000 ${section4.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            <div className="text-center mb-16">
                                <div className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-medium text-[#f7a536] mb-6">
                                    <Award className="h-4 w-4" />
                                    The Difference
                                </div>
                                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                                    Manual{' '}
                                    <span className="text-white/30">vs</span>{' '}
                                    <span className="bg-gradient-to-r from-[#f7a536] to-[#e8563f] bg-clip-text text-transparent">
                                        Automated
                                    </span>
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                <div className="grid grid-cols-3 border-b border-white/5">
                                    <div className="p-5 text-sm font-semibold text-white/40 uppercase tracking-wider">Metric</div>
                                    <div className="p-5 text-sm font-semibold text-white/30 uppercase tracking-wider text-center border-x border-white/5">Traditional</div>
                                    <div className="p-5 text-sm font-semibold text-[#f7a536] uppercase tracking-wider text-center">MagicQC</div>
                                </div>
                                {[
                                    { metric: 'Speed', old: 'Minutes per item', new: 'Seconds per item' },
                                    { metric: 'Accuracy', old: 'Operator-dependent', new: 'Sub-millimeter precision' },
                                    { metric: 'Consistency', old: 'Varies with fatigue', new: '100% repeatable' },
                                    { metric: 'Data', old: 'Paper records', new: 'Digital & real-time' },
                                    { metric: 'Scale', old: 'Limited by workforce', new: 'Unlimited capacity' },
                                ].map((row, i) => (
                                    <div
                                        key={row.metric}
                                        className="grid grid-cols-3 border-b border-white/5 last:border-b-0 group hover:bg-white/[0.03] transition-colors duration-300"
                                        style={{
                                            opacity: section4.isVisible ? 1 : 0,
                                            transform: section4.isVisible ? 'translateX(0)' : 'translateX(-20px)',
                                            transition: `all 0.5s ease-out ${i * 0.1}s`,
                                        }}
                                    >
                                        <div className="p-5 font-semibold text-white/80">{row.metric}</div>
                                        <div className="p-5 text-white/30 text-center text-sm border-x border-white/5">{row.old}</div>
                                        <div className="p-5 text-[#f7a536]/80 text-center text-sm font-medium">{row.new}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section id="contact" className="py-32 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute inset-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#f7a536]/5 blur-[150px]" />
                    </div>

                    <div className="relative max-w-4xl mx-auto px-6 text-center">
                        <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
                            Ready to Elevate Your
                            <br />
                            <span className="bg-gradient-to-r from-[#f7a536] to-[#e8563f] bg-clip-text text-transparent">
                                Quality Standards?
                            </span>
                        </h2>
                        <p className="text-lg text-white/40 mb-10 max-w-2xl mx-auto">
                            Join industry leaders who trust intelligent automation for precision quality verification.
                        </p>

                        {!auth.user && (
                            <Link
                                href="/system-login"
                                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#f7a536] to-[#e8563f] px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-[#f7a536]/25 transition-all duration-300 hover:shadow-3xl hover:shadow-[#f7a536]/40 hover:scale-105"
                            >
                                Start Now
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        )}

                        {/* Contact Cards */}
                        <div className="mt-20 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                            {[
                                { icon: Phone, label: 'Call Us', value: '+92 333 7696789', href: 'tel:+923337696789' },
                                { icon: Mail, label: 'Email', value: 'awaisfrombit@gmail.com', href: 'mailto:awaisfrombit@gmail.com' },
                                { icon: MapPin, label: 'Location', value: 'NUTECH, I-12/2, Islamabad', href: null },
                            ].map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href || '#'}
                                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:border-[#f7a536]/20"
                                >
                                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7a536]/15 to-[#e8563f]/10 transition-transform duration-300 group-hover:scale-110">
                                        <item.icon className="h-5 w-5 text-[#f7a536]" />
                                    </div>
                                    <div className="text-xs text-white/30 uppercase tracking-wider mb-1">{item.label}</div>
                                    <div className="text-sm text-white/60 group-hover:text-white/80 transition-colors duration-300">{item.value}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-12 mb-12">
                            {/* Company */}
                            <div>
                                <img
                                    src="/MagicQC logo.png"
                                    alt="MagicQC"
                                    className="h-9 w-auto brightness-0 invert opacity-70 mb-4"
                                />
                                <p className="text-sm text-white/30 leading-relaxed mb-4">Developed by Robionix Technologies (Pvt) Ltd.</p>
                                <p className="text-xs text-white/20">A NUTECH-based industrial automation company led by foreign-qualified faculty and experienced industrial experts.</p>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Quick Links</h4>
                                <div className="space-y-3">
                                    {['Features', 'How It Works', 'Results', 'Contact'].map((item) => (
                                        <a
                                            key={item}
                                            href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="block text-sm text-white/25 hover:text-[#f7a536] transition-colors duration-300"
                                        >
                                            {item}
                                        </a>
                                    ))}
                                    <Link
                                        href="/developer-login"
                                        className="inline-flex items-center gap-2 text-sm text-white/25 hover:text-[#f7a536] transition-colors duration-300"
                                    >
                                        <Code2 className="h-3.5 w-3.5" />
                                        Developer Access
                                    </Link>
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Contact</h4>
                                <div className="space-y-3">
                                    <a href="tel:+923337696789" className="flex items-center gap-3 text-sm text-white/25 hover:text-[#f7a536] transition-colors duration-300">
                                        <Phone className="h-4 w-4 text-white/15" />
                                        +92 333 7696789
                                    </a>
                                    <a href="mailto:awaisfrombit@gmail.com" className="flex items-center gap-3 text-sm text-white/25 hover:text-[#f7a536] transition-colors duration-300">
                                        <Mail className="h-4 w-4 text-white/15" />
                                        awaisfrombit@gmail.com
                                    </a>
                                    <div className="flex items-start gap-3 text-sm text-white/25">
                                        <MapPin className="h-4 w-4 text-white/15 mt-0.5 shrink-0" />
                                        National University of Technology (NUTECH), I-12/2, Islamabad
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-white/15 text-xs">
                                © 2026 MagicQC by Robionix Technologies (Pvt) Ltd. All rights reserved.
                            </p>
                            <p className="text-white/10 text-xs">
                                A University for Industry — NUTECH, Islamabad
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
