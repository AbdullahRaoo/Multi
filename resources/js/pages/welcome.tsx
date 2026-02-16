import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
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
    Code2
} from 'lucide-react';

export default function Welcome() {
    const { auth, basePath } = usePage<SharedData>().props as any;

    return (
        <>
            <Head title="MagicQC - Garment Quality Control">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                {/* Navigation */}
                <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <nav className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src={`${basePath || ''}/MagicQC logo.png`}
                                    alt="MagicQC"
                                    className="h-10 w-auto"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                {auth.user && (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#264c59] to-[#3d6b7a] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#264c59]/25 transition-all hover:shadow-xl hover:shadow-[#264c59]/30"
                                    >
                                        Go to Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#264c59]/5 blur-3xl" />
                        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-[#f7a536]/10 blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-rose-100/50 blur-3xl" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#264c59]/10 px-4 py-1.5 text-sm font-medium text-[#264c59] mb-6">
                                <Zap className="h-4 w-4" />
                                AI-Powered Quality Control
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
                                Precision{' '}
                                <span className="bg-gradient-to-r from-[#264c59] to-[#3d6b7a] bg-clip-text text-transparent">
                                    Garment
                                </span>
                                <br />
                                Quality Control
                            </h1>

                            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Transform your garment inspection process with AI-powered keypoint detection,
                                real-time measurements, and comprehensive quality analytics.
                            </p>

                            {!auth.user && (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/system-login"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#264c59] to-[#3d6b7a] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#264c59]/25 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#264c59]/30"
                                    >
                                        Login
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Hero Image/Stats */}
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {[
                                { value: '99.5%', label: 'Accuracy Rate', icon: Target },
                                { value: '10x', label: 'Faster Inspection', icon: Clock },
                                { value: '500+', label: 'Measurements/Day', icon: Ruler },
                                { value: '24/7', label: 'Quality Monitoring', icon: Shield },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="group rounded-2xl bg-white p-6 shadow-lg shadow-slate-100 border border-slate-100 text-center transition-all hover:shadow-xl hover:-translate-y-1"
                                >
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#264c59]/10 to-[#f7a536]/10">
                                        <stat.icon className="h-6 w-6 text-[#264c59]" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                    <div className="text-sm text-slate-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                Everything You Need for QC Excellence
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Comprehensive tools designed for garment manufacturing quality control
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Target,
                                    title: 'AI Keypoint Detection',
                                    description: 'Automatically detect and annotate critical measurement points on garments using advanced AI algorithms.',
                                    iconColor: 'text-rose-600',
                                    bgColor: 'bg-rose-100',
                                },
                                {
                                    icon: Camera,
                                    title: 'Camera Calibration',
                                    description: 'Precise camera calibration system for accurate real-world measurements from image data.',
                                    iconColor: 'text-blue-600',
                                    bgColor: 'bg-blue-100',
                                },
                                {
                                    icon: Ruler,
                                    title: 'Real-time Measurements',
                                    description: 'Instant, accurate garment measurements with configurable tolerances and PASS/FAIL indicators.',
                                    iconColor: 'text-amber-600',
                                    bgColor: 'bg-amber-100',
                                },
                                {
                                    icon: BarChart3,
                                    title: 'Quality Analytics',
                                    description: 'Comprehensive dashboards and reports to track quality metrics across brands and operators.',
                                    iconColor: 'text-emerald-600',
                                    bgColor: 'bg-emerald-100',
                                },
                                {
                                    icon: Shield,
                                    title: 'Brand Management',
                                    description: 'Organize articles, measurements specs, and tolerances by brand for streamlined workflows.',
                                    iconColor: 'text-violet-600',
                                    bgColor: 'bg-violet-100',
                                },
                                {
                                    icon: CheckCircle2,
                                    title: 'Purchase Order Tracking',
                                    description: 'Link measurements to purchase orders for complete traceability and compliance.',
                                    iconColor: 'text-cyan-600',
                                    bgColor: 'bg-cyan-100',
                                },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group rounded-2xl bg-white p-8 shadow-lg shadow-slate-100 border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1"
                                >
                                    <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl ${feature.bgColor}`}>
                                        <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-gradient-to-br from-[#264c59] via-[#3d6b7a] to-[#264c59] relative overflow-hidden">
                    {/* Decorations */}
                    <div className="absolute inset-0">
                        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#f7a536]/20 blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    </div>

                    <div className="relative max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to Transform Your QC Process?
                        </h2>
                        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                            Join leading garment manufacturers who trust MagicQC for precision quality control.
                        </p>


                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 bg-slate-900">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src={`${basePath || ''}/MagicQC logo.png`}
                                    alt="MagicQC"
                                    className="h-8 w-auto brightness-0 invert"
                                />
                            </div>

                            <p className="text-slate-400 text-sm">
                                © 2026 MagicQC. All rights reserved.
                            </p>

                            <Link
                                href="/developer-login"
                                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#f7a536] transition-colors"
                            >
                                <Code2 className="h-4 w-4" />
                                Developer Access
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
