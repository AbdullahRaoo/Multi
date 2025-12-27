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
import { Input } from '@/components/ui/input';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { type PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, ArrowLeft, Package, Plus, Eye, Search, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface ArticleType {
    id: number;
    name: string;
}

interface Article {
    id: number;
    article_style: string;
    description: string | null;
    article_type: ArticleType;
    created_at: string;
    updated_at: string;
}

interface Brand {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Filters {
    search: string;
}

interface Props {
    brand: Brand;
    articles: PaginatedData<Article>;
    filters: Filters;
}

export default function Show({ brand, articles, filters }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<{ id: number; article_style: string } | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    
    // Determine default tab - check for tab in URL or flash message
    const getDefaultTab = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam === 'articles') {
            return 'articles';
        }
        return 'details';
    };
    
    const [activeTab, setActiveTab] = useState(getDefaultTab());
    
    // Auto-switch to articles tab if redirected from article creation
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'articles') {
            setActiveTab('articles');
        }
    }, []);

    const handleDeleteClick = (article: Article) => {
        setArticleToDelete({ id: article.id, article_style: article.article_style });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (articleToDelete) {
            router.delete(brandRoutes.articles.destroy({ brand: brand.id, article: articleToDelete.id }).url);
        }
    };

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        
        if (search) params.set('search', search);

        router.get(brandRoutes.show(brand.id).url + (params.toString() ? '?' + params.toString() : ''), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [search, brand.id]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search, applyFilters]);

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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Articles ({articles.total || 0})
                                    </h2>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Manage articles for this brand
                                    </p>
                                </div>
                                <Link href={brandRoutes.articles.create(brand.id).url}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Article
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                                    <Input
                                        type="text"
                                        placeholder="Search by type, style, or description..."
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
                                            <TableHead>Article Type</TableHead>
                                            <TableHead>Style</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead>Updated At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {articles.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-neutral-500 py-8">
                                                    No articles found. Create your first one!
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            articles.data.map((article) => (
                                                <TableRow 
                                                    key={article.id}
                                                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                                    onClick={() => router.visit(brandRoutes.articles.show({ brand: brand.id, article: article.id }).url)}
                                                >
                                                    <TableCell className="font-medium">
                                                        {article.article_type?.name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>{article.article_style}</TableCell>
                                                    <TableCell>
                                                        {article.description ? (
                                                            <span className="line-clamp-2 max-w-xs">
                                                                {article.description}
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(article.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(article.updated_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div 
                                                            className="flex items-center justify-end gap-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Link href={brandRoutes.articles.show({ brand: brand.id, article: article.id }).url}>
                                                                <Button variant="outline" size="sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={brandRoutes.articles.edit({ brand: brand.id, article: article.id }).url}>
                                                                <Button variant="outline" size="sm">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(article);
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

                            {articles.links && articles.links.length > 3 && (
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Showing {articles.from} to {articles.to} of {articles.total} results
                                    </div>
                                    <div className="flex gap-2">
                                        {articles.links.map((link, index) => (
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
                        </div>
                    </TabsContent>
                </Tabs>

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Article"
                    description={`Are you sure you want to delete article "${articleToDelete?.article_style}"? This action cannot be undone and will permanently delete the article and all associated data.`}
                />
            </div>
        </AppLayout>
    );
}

