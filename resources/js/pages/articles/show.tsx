import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, ArrowLeft, Plus, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Brand {
    id: number;
    name: string;
}

interface ArticleType {
    id: number;
    name: string;
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

interface Article {
    id: number;
    article_style: string;
    description: string | null;
    article_type: ArticleType;
    measurements?: Measurement[];
    created_at: string;
    updated_at: string;
}

interface Props {
    brand: Brand;
    article: Article;
}

export default function Show({ brand, article }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [measurementToDelete, setMeasurementToDelete] = useState<{ id: number; code: string } | null>(null);

    const handleDeleteClick = (measurement: Measurement) => {
        setMeasurementToDelete({ id: measurement.id, code: measurement.code });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (measurementToDelete) {
            router.delete(brandRoutes.articles.measurements.destroy({ brand: brand.id, article: article.id, measurement: measurementToDelete.id }).url, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setMeasurementToDelete(null);
                },
            });
        }
    };

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
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Article - ${article.article_style}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Article Details</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            View article information
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => router.visit(brandRoutes.show(brand.id).url + '?tab=articles')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Link href={brandRoutes.articles.edit({ brand: brand.id, article: article.id }).url}>
                            <Button variant="outline">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Article Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Brand
                                </p>
                                <p className="text-base font-semibold">{brand.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Article Type
                                </p>
                                <p className="text-base">{article.article_type?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Article Style
                                </p>
                                <p className="text-base font-semibold">{article.article_style}</p>
                            </div>
                            {article.description && (
                                <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                        Description
                                    </p>
                                    <p className="text-base whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        {article.description}
                                    </p>
                                </div>
                            )}
                            {/* <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Created At
                                </p>
                                <p className="text-base">
                                    {new Date(article.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Updated At
                                </p>
                                <p className="text-base">
                                    {new Date(article.updated_at).toLocaleString()}
                                </p>
                            </div> */}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Measurements</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage measurements for this article
                        </p>
                    </div>
                    <Link href={brandRoutes.articles.measurements.create({ brand: brand.id, article: article.id }).url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Measurement
                        </Button>
                    </Link>
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
                            {article.measurements && article.measurements.length > 0 ? (
                                article.measurements.map((measurement) => (
                                    <TableRow 
                                        key={measurement.id}
                                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => router.visit(brandRoutes.articles.measurements.show({ brand: brand.id, article: article.id, measurement: measurement.id }).url)}
                                    >
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
                                            <div 
                                                className="flex items-center justify-end gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* <Link href={brandRoutes.articles.measurements.show({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link> */}
                                                <Link href={brandRoutes.articles.measurements.edit({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(measurement);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                                        No measurements found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

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

