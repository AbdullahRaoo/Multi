import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Pencil, ArrowLeft, Package, Plus, Eye } from 'lucide-react';

interface ArticleType {
    id: number;
    name: string;
}

interface Article {
    id: number;
    article_style: string;
    article_size: string | null;
    article_type: ArticleType;
    created_at: string;
}

interface Brand {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    articles?: Article[];
}

interface Props {
    brand: Brand;
}

export default function Show({ brand }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Brands',
            href: brandRoutes.index().url,
        },
        {
            title: brand.name,
            href: brandRoutes.show(brand.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Brand - ${brand.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Brand Details</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            View brand information
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={brandRoutes.index().url}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <Link href={brandRoutes.edit(brand.id).url}>
                            <Button>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="articles">
                            <Package className="mr-2 h-4 w-4" />
                            Articles
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Brand Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Name
                                        </p>
                                        <p className="text-base font-semibold">{brand.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Created At
                                        </p>
                                        <p className="text-base">
                                            {new Date(brand.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {brand.description && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                                Description
                                            </p>
                                            <p className="text-base whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                                {brand.description}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Updated At
                                        </p>
                                        <p className="text-base">
                                            {new Date(brand.updated_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="articles" className="mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Articles ({brand.articles?.length || 0})
                                    </CardTitle>
                                    <Link href={brandRoutes.articles.index(brand.id).url}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Article
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!brand.articles || brand.articles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-6 mb-4">
                                            <Package className="h-12 w-12 text-neutral-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No Articles Available</h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mb-4">
                                            Articles associated with this brand will appear here.
                                        </p>
                                        <Link href={brandRoutes.articles.create(brand.id).url}>
                                            <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create First Article
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-sidebar-border bg-white dark:bg-neutral-900 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Article Type</TableHead>
                                                    <TableHead>Style</TableHead>
                                                    <TableHead>Size</TableHead>
                                                    <TableHead>Created At</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {brand.articles.map((article) => (
                                                    <TableRow key={article.id}>
                                                        <TableCell className="font-medium">
                                                            {article.article_type?.name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{article.article_style}</TableCell>
                                                        <TableCell>
                                                            {article.article_size || (
                                                                <span className="text-neutral-400">N/A</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(article.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link href={brandRoutes.articles.show({ brand: brand.id, article: article.id }).url}>
                                                                    <Button variant="outline" size="sm">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

