import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Pencil, ArrowLeft, Ruler } from 'lucide-react';

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
    article_size: string | null;
    article_type: ArticleType;
    created_at: string;
    updated_at: string;
}

interface Props {
    brand: Brand;
    article: Article;
}

export default function Show({ brand, article }: Props) {
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
                        <Link href={brandRoutes.articles.index(brand.id).url}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
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
                        <div className="grid gap-4 md:grid-cols-2">
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
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Article Size
                                </p>
                                <p className="text-base">
                                    {article.article_size || (
                                        <span className="text-neutral-400">Not specified</span>
                                    )}
                                </p>
                            </div>
                            <div>
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
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Measurements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-6 mb-4">
                                <Ruler className="h-12 w-12 text-neutral-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No Measurements Added</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mb-4">
                                Add measurements for this article to track detailed specifications.
                            </p>
                            <Button>
                                <Ruler className="h-4 w-4 mr-2" />
                                Add Measurements
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

