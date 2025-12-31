import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import purchaseOrderRoutes from '@/routes/purchase-orders';
import { type BreadcrumbItem } from '@/types';
import { type PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface Brand {
    id: number;
    name: string;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    date: string;
    country: string;
    status: string;
    brand: Brand;
    created_at: string;
    updated_at: string;
}

interface Filters {
    search: string;
}

interface Props {
    purchaseOrders: PaginatedData<PurchaseOrder>;
    filters: Filters;
}

export default function Index({ purchaseOrders, filters }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<{ id: number; po_number: string } | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Purchase Orders',
            href: purchaseOrderRoutes.index().url,
        },
    ];

    const handleDeleteClick = (purchaseOrder: PurchaseOrder) => {
        setPurchaseOrderToDelete({ id: purchaseOrder.id, po_number: purchaseOrder.po_number });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (purchaseOrderToDelete) {
            router.delete(purchaseOrderRoutes.destroy({ purchase_order: purchaseOrderToDelete.id }).url);
        }
    };

    const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' => {
        switch (status) {
            case 'Active':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Completed':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const getStatusBadgeClassName = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            default:
                return '';
        }
    };

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        
        if (search) params.set('search', search);

        router.get(purchaseOrderRoutes.index().url + (params.toString() ? '?' + params.toString() : ''), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [search]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search, applyFilters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Purchase Orders</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage all purchase orders
                        </p>
                    </div>
                    <Link href={purchaseOrderRoutes.create().url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Purchase Order
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                        <Input
                            type="text"
                            placeholder="Search by PO number, brand, or country..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-sidebar-border bg-white dark:bg-neutral-900">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-neutral-500">
                                        No purchase orders found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchaseOrders.data.map((po) => (
                                    <TableRow 
                                        key={po.id}
                                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => router.visit(purchaseOrderRoutes.show({ purchase_order: po.id }).url)}
                                    >
                                        <TableCell className="font-medium">
                                            {po.po_number}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(po.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{po.brand?.name || 'N/A'}</TableCell>
                                        <TableCell>{po.country}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusBadgeVariant(po.status)}
                                                className={getStatusBadgeClassName(po.status)}
                                            >
                                                {po.status || 'Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(po.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(po.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div 
                                                className="flex items-center justify-end gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link href={purchaseOrderRoutes.show({ purchase_order: po.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={purchaseOrderRoutes.edit({ purchase_order: po.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(po);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {purchaseOrders.links && purchaseOrders.links.length > 3 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            Showing {purchaseOrders.from} to {purchaseOrders.to} of {purchaseOrders.total} results
                        </div>
                        <div className="flex gap-2">
                            {purchaseOrders.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-sidebar-primary text-white'
                                            : 'bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Purchase Order"
                    description={`Are you sure you want to delete Purchase Order "${purchaseOrderToDelete?.po_number}"? This action cannot be undone and will permanently delete the purchase order and all associated data.`}
                />
            </div>
        </AppLayout>
    );
}

