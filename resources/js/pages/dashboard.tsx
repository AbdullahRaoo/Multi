import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Tag,
    Package,
    Layers,
    Ruler,
    Users,
    ShoppingCart,
    TrendingUp,
    ArrowRight,
    ClipboardList,
    Upload,
    Sparkles,
    Activity,
    CheckCircle2,
    Clock,
    BarChart3,
    Zap,
    Settings,
    FileText
} from 'lucide-react';
import operatorRoutes from '@/routes/operators';
import purchaseOrderRoutes from '@/routes/purchase-orders';

import { type SharedData } from '@/types';

interface Props {
    totalBrands: number;
    totalArticles: number;
    totalArticleTypes: number;
    totalMeasurements: number;
    totalOperators: number;
    totalPurchaseOrders: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Vibrant, medium-toned color palette - distinct and attractive
const statCardStyles = [
    {
        gradient: 'from-rose-400 to-pink-500',
        iconBg: 'bg-white/90',
        iconColor: 'text-rose-600',
        borderColor: 'border-rose-300',
        textColor: 'text-white',
        subtextColor: 'text-white/90',
    },
    {
        gradient: 'from-violet-400 to-purple-500',
        iconBg: 'bg-white/90',
        iconColor: 'text-violet-600',
        borderColor: 'border-violet-300',
        textColor: 'text-white',
        subtextColor: 'text-white/90',
    },
    {
        gradient: 'from-amber-400 to-orange-500',
        iconBg: 'bg-white/90',
        iconColor: 'text-amber-600',
        borderColor: 'border-amber-300',
        textColor: 'text-white',
        subtextColor: 'text-white/90',
    },
    {
        gradient: 'from-sky-400 to-blue-500',
        iconBg: 'bg-white/90',
        iconColor: 'text-sky-600',
        borderColor: 'border-sky-300',
        textColor: 'text-white',
        subtextColor: 'text-white/90',
    },
    {
        gradient: 'from-teal-400 to-emerald-500',
        iconBg: 'bg-white/90',
        iconColor: 'text-teal-600',
        borderColor: 'border-teal-300',
        textColor: 'text-white',
        subtextColor: 'text-white/90',
    },
];

// Stat card data configuration
const getStatCards = (props: Props) => [
    {
        title: 'Total Brands',
        value: props.totalBrands,
        description: 'Active brands in system',
        icon: Tag,
        href: brandRoutes.index().url,
        clickable: true,
        ...statCardStyles[0],
    },
    {
        title: 'Total Operators',
        value: props.totalOperators,
        description: 'Active QC operators',
        icon: Users,
        href: operatorRoutes.index().url,
        clickable: true,
        ...statCardStyles[1],
    },
    {
        title: 'Purchase Orders',
        value: props.totalPurchaseOrders,
        description: 'Orders issued',
        icon: ShoppingCart,
        href: purchaseOrderRoutes.index().url,
        clickable: true,
        ...statCardStyles[2],
    },
    {
        title: 'Total Articles',
        value: props.totalArticles,
        description: 'Across all brands',
        icon: Package,
        href: '',
        clickable: false,
        ...statCardStyles[3],
    },
    {
        title: 'Article Types',
        value: props.totalArticleTypes,
        description: 'Product categories',
        icon: Layers,
        href: '',
        clickable: false,
        ...statCardStyles[4],
    },
];

// Updated quick action buttons - colors distinct from stat cards
const quickActions = [
    {
        title: 'View Brands',
        description: 'Manage garment brands',
        icon: Tag,
        href: brandRoutes.index().url,
        bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
        textColor: 'text-white',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
    },
    {
        title: 'Manage Operators',
        description: 'QC operator management',
        icon: Users,
        href: operatorRoutes.index().url,
        bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        textColor: 'text-white',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
    },
    {
        title: 'Create Purchase Order',
        description: 'Start a new purchase order',
        icon: ShoppingCart,
        href: purchaseOrderRoutes.create().url,
        bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        textColor: 'text-white',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
    },
];

export default function Dashboard(props: Props) {
    const { auth } = usePage<SharedData>().props;
    const statCards = getStatCards(props);

    const handleCardClick = (route: string) => {
        router.visit(route);
    };

    const handleActionClick = (route: string) => {
        router.visit(route);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Hero Section - Light/white background for dark logo */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-xl border border-slate-200">
                    {/* Decorative elements with varied colors */}
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
                    <div className="absolute right-20 top-1/2 h-20 w-20 rounded-full bg-[#f7a536]/10 blur-xl" />
                    <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-[#264c59]/10 blur-2xl" />

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                                Welcome back, {auth?.user?.name || 'User'}!
                            </h1>
                            <p className="mt-2 text-lg text-slate-600">
                                Manage your garment quality control operations with precision and efficiency.
                            </p>

                            {/* Quick Stats Row with varied accent colors */}
                            <div className="mt-6 flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                                        <Tag className="h-4 w-4 text-rose-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-700">{props.totalBrands}</div>
                                        <div className="text-xs text-slate-500">Brands</div>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-700">{props.totalArticles}</div>
                                        <div className="text-xs text-slate-500">Articles</div>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                                        <Users className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-700">{props.totalOperators}</div>
                                        <div className="text-xs text-slate-500">Operators</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Quick Actions with dark colors */}
                <div className="grid gap-4 md:grid-cols-3">
                    {quickActions.map((action) => (
                        <button
                            key={action.title}
                            onClick={() => handleActionClick(action.href)}
                            className={`group relative overflow-hidden rounded-xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${action.bgColor} ${action.textColor}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${action.iconBg}`}>
                                        <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                                    </div>
                                    <h3 className="font-semibold">{action.title}</h3>
                                    <p className="mt-1 text-sm opacity-80">
                                        {action.description}
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative gradient */}
                            <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        </button>
                    ))}
                </div>

                {/* Stats Grid with dark rich colors */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-red-700" />
                            <h2 className="text-lg font-semibold text-foreground">Overview Statistics</h2>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Updated just now</span>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {statCards.map((card) => (
                            <Card
                                key={card.title}
                                className={`group relative overflow-hidden border shadow-lg transition-all duration-300 ${card.borderColor || 'border-slate-200'} ${card.clickable
                                    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl'
                                    : ''
                                    }`}
                                onClick={card.clickable && card.href ? () => handleCardClick(card.href!) : undefined}
                            >
                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />

                                {/* Content */}
                                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className={`text-sm font-medium ${card.subtextColor || 'text-slate-600'}`}>
                                        {card.title}
                                    </CardTitle>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} shadow-md`}>
                                        <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className={`text-3xl font-bold ${card.textColor || 'text-slate-900'}`}>
                                                {card.value}
                                            </div>
                                            <p className={`mt-1 text-sm ${card.subtextColor || 'text-slate-500'}`}>
                                                {card.description}
                                            </p>
                                        </div>
                                        {card.clickable && (
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}/20 opacity-0 transition-opacity group-hover:opacity-100`}>
                                                <ArrowRight className={`h-4 w-4 ${card.textColor || 'text-slate-700'}`} />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                {/* Decorative elements */}
                                <div className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full ${card.iconBg}/10 blur-xl`} />
                                <div className="absolute -top-4 right-12 h-16 w-16 rounded-full bg-white/30 blur-lg" />
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Activity Section with dark accent colors */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* System Status */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">System Status</CardTitle>
                                    <CardDescription>All systems operational</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-sm font-medium">Database</span>
                                    </div>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-sm font-medium">API Services</span>
                                    </div>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Healthy</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-sm font-medium">Camera Integration</span>
                                    </div>
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Ready</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Tips */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <Sparkles className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Quick Tips</CardTitle>
                                    <CardDescription>Get the most out of MagicQC</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/30 p-3">
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
                                        1
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Set up your <span className="font-medium text-foreground">Brand</span> and operator profiles to get started.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-950/30 p-3">
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
                                        2
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Create <span className="font-medium text-foreground">Purchase Orders</span> to track garment batches.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/30 p-3">
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-slate-600 text-xs font-bold text-white">
                                        3
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Calibrate your camera for accurate real-world measurements.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
