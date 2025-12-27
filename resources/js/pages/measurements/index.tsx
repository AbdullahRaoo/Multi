import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, Search, ArrowLeft } from 'lucide-react';
import { type PaginatedData } from '@/types';
import { useState, useEffect, useCallback } from 'react';

interface Brand {
    id: number;
    name: string;
}

interface Article {
    id: number;
    article_style: string;
}

interface MeasurementSize {
    id: number;
    size: string;
    value: number;
    unit: string;
}

interface Measurement {
    id: number;
    code: string;
    measurement: string;
    tol_plus: number | null;
    tol_minus: number | null;
    sizes: MeasurementSize[];
    created_at: string;
    updated_at: string;
}

interface Filters {
    search: string;
}

interface Props {
    brand: Brand;
    article: Article;
    measurements: PaginatedData<Measurement>;
    filters: Filters;
}

export default function Index({ brand, article, measurements, filters }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [measurementToDelete, setMeasurementToDelete] = useState<{ id: number; code: string } | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Brands',
            href: brandRoutes.index().url,
        },
        {
            title: brand.name,
            href: brandRoutes.show(brand.id).url,
        },
        {
            title: 'Articles',
            href: brandRoutes.articles.index(brand.id).url,
        },
        {
            title: article.article_style,
            href: brandRoutes.articles.show({ brand: brand.id, article: article.id }).url,
        },
        {
            title: 'Measurements',
            href: brandRoutes.articles.measurements.index({ brand: brand.id, article: article.id }).url,
        },
    ];

    const handleDeleteClick = (measurement: Measurement) => {
        setMeasurementToDelete({ id: measurement.id, code: measurement.code });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (measurementToDelete) {
            router.delete(brandRoutes.articles.measurements.destroy({ brand: brand.id, article: article.id, measurement: measurementToDelete.id }).url);
        }
    };

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        
        if (search) params.set('search', search);

        router.get(brandRoutes.articles.measurements.index({ brand: brand.id, article: article.id }).url + (params.toString() ? '?' + params.toString() : ''), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [search, brand.id, article.id]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search, applyFilters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Measurements - ${article.article_style}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Measurements</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage measurements for {article.article_style}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={brandRoutes.articles.show({ brand: brand.id, article: article.id }).url}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Article
                            </Button>
                        </Link>
                        <Link href={brandRoutes.articles.measurements.create({ brand: brand.id, article: article.id }).url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Measurement
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                        <Input
                            type="text"
                            placeholder="Search by code or measurement..."
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
                                <TableHead>Code</TableHead>
                                <TableHead>Measurement</TableHead>
                                <TableHead>Tol (+)</TableHead>
                                <TableHead>Tol (-)</TableHead>
                                <TableHead>Sizes</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {measurements.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-neutral-500">
                                        No measurements found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                measurements.data.map((measurement) => (
                                    <TableRow key={measurement.id}>
                                        <TableCell className="font-medium">
                                            {measurement.code}
                                        </TableCell>
                                        <TableCell>{measurement.measurement}</TableCell>
                                        <TableCell>
                                            {measurement.tol_plus !== null ? measurement.tol_plus : (
                                                <span className="text-neutral-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {measurement.tol_minus !== null ? measurement.tol_minus : (
                                                <span className="text-neutral-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {measurement.sizes && measurement.sizes.length > 0 ? (
                                                <span className="text-sm">
                                                    {measurement.sizes.length} size{measurement.sizes.length !== 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(measurement.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(measurement.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={brandRoutes.articles.measurements.show({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={brandRoutes.articles.measurements.edit({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(measurement)}
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

                {measurements.links && measurements.links.length > 3 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            Showing {measurements.from} to {measurements.to} of {measurements.total} results
                        </div>
                        <div className="flex gap-2">
                            {measurements.links.map((link, index) => (
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
                    title="Delete Measurement"
                    description={`Are you sure you want to delete measurement "${measurementToDelete?.code}"? This action cannot be undone and will permanently delete the measurement and all associated data.`}
                />
            </div>
        </AppLayout>
    );
}

