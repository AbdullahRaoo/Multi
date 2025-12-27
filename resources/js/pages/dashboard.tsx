import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import purchaseOrderRoutes from '@/routes/purchase-orders';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
];

interface Props {
    totalPurchaseOrders?: number;
}

export default function Dashboard({ totalPurchaseOrders = 0 }: Props) {
    const handleCardClick = () => {
        router.visit(purchaseOrderRoutes.index().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={handleCardClick}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Purchase Orders
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPurchaseOrders}</div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                Total purchase orders in the system
                            </p>
                        </CardContent>
                    </Card>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        {/* Placeholder for future widget */}
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        {/* Placeholder for future widget */}
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    {/* Placeholder for future content */}
                </div>
            </div>
        </AppLayout>
    );
}
