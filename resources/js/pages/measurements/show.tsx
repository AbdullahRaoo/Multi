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
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Pencil, ArrowLeft } from 'lucide-react';

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

interface Props {
    brand: Brand;
    article: Article;
    measurement: Measurement;
}

export default function Show({ brand, article, measurement }: Props) {
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
        {
            title: measurement.code,
            href: brandRoutes.articles.measurements.show({ brand: brand.id, article: article.id, measurement: measurement.id }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Measurement - ${measurement.code}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Measurement Details</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            View measurement information
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={brandRoutes.articles.show({ brand: brand.id, article: article.id }).url}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <Link href={brandRoutes.articles.measurements.edit({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                            <Button variant="outline">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Measurement Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Article
                                </p>
                                <p className="text-base font-semibold">{article.article_style}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Code
                                </p>
                                <p className="text-base font-semibold">{measurement.code}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Measurement
                                </p>
                                <p className="text-base">{measurement.measurement}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Tol (+)
                                </p>
                                <p className="text-base">
                                    {measurement.tol_plus !== null ? measurement.tol_plus : (
                                        <span className="text-neutral-400">Not specified</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Tol (-)
                                </p>
                                <p className="text-base">
                                    {measurement.tol_minus !== null ? measurement.tol_minus : (
                                        <span className="text-neutral-400">Not specified</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {measurement.sizes && measurement.sizes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Size Sections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-sidebar-border bg-white dark:bg-neutral-900 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Unit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {measurement.sizes.map((size) => (
                                            <TableRow key={size.id}>
                                                <TableCell className="font-medium">
                                                    {size.size}
                                                </TableCell>
                                                <TableCell>{size.value}</TableCell>
                                                <TableCell>{size.unit}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

