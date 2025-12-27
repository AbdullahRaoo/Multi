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

interface Filters {
    search: string;
}

interface Props {
    brand: Brand;
    articles: PaginatedData<Article>;
    filters: Filters;
}

export default function Index({ brand, articles, filters }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<{ id: number; article_style: string } | null>(null);
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
    ];

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

        router.get(brandRoutes.articles.index(brand.id).url + (params.toString() ? '?' + params.toString() : ''), {}, {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Articles - ${brand.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Articles</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage articles for {brand.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={brandRoutes.show(brand.id).url}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Brand
                            </Button>
                        </Link>
                        <Link href={brandRoutes.articles.create(brand.id).url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Article
                            </Button>
                        </Link>
                    </div>
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
                                    <TableCell colSpan={6} className="text-center text-neutral-500">
                                        No articles found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                articles.data.map((article) => (
                                    <TableRow key={article.id}>
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
                                            <div className="flex items-center justify-end gap-2">
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
                                                    onClick={() => handleDeleteClick(article)}
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

