import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import purchaseOrderRoutes from '@/routes/purchase-orders';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, CircleCheck, Clock, ShoppingCart } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
];

interface Props {
    totalPurchaseOrders?: number;
    activePurchaseOrders?: number;
    pendingPurchaseOrders?: number;
    completedPurchaseOrders?: number;
}

export default function Dashboard({
    totalPurchaseOrders = 0,
    activePurchaseOrders = 0,
    pendingPurchaseOrders = 0,
    completedPurchaseOrders = 0,
}: Props) {
    const handleCardClick = () => {
        router.visit(purchaseOrderRoutes.index().url);
    };

    const handleStatusClick = (status: string) => {
        router.visit(purchaseOrderRoutes.index().url + `?status=${status}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <Card
                        className="cursor-pointer border-neutral-200 transition-shadow hover:shadow-lg dark:border-neutral-800"
                        onClick={handleCardClick}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">{totalPurchaseOrders}</div>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Total purchase orders in the system</p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer border-green-200 transition-shadow hover:shadow-lg dark:border-green-800"
                        onClick={() => handleStatusClick('Active')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Purchase Orders</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activePurchaseOrders}</div>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Currently active purchase orders</p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer border-yellow-200 transition-shadow hover:shadow-lg dark:border-yellow-800"
                        onClick={() => handleStatusClick('Pending')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Purchase Orders</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingPurchaseOrders}</div>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Purchase orders awaiting action</p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer border-blue-200 transition-shadow hover:shadow-lg dark:border-blue-800"
                        onClick={() => handleStatusClick('Completed')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Purchase Orders</CardTitle>
                            <CircleCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedPurchaseOrders}</div>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Completed purchase orders</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    {/* Placeholder for future content */}
                </div>
            </div>
        </AppLayout>
    );
}
