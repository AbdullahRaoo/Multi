import { store } from '@/actions/App/Http/Controllers/ArticleController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface Brand {
    id: number;
    name: string;
}

interface ArticleType {
    id: number;
    name: string;
}

interface Props {
    brand: Brand;
    articleTypes: ArticleType[];
}

export default function Create({ brand, articleTypes }: Props) {
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
            title: 'Create Article',
            href: brandRoutes.articles.create(brand.id).url,
        },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        article_type_id: '',
        article_style: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store(brand.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Article created successfully');
                reset();
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Create Article - ${brand.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Create Article</h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Add a new article for {brand.name}</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Article Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="article_type_id">Article Type *</Label>
                                    <Select value={data.article_type_id} onValueChange={(value) => setData('article_type_id', value)} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select article type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {articleTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.article_type_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="article_style">Article Style *</Label>
                                    <Input
                                        id="article_style"
                                        value={data.article_style}
                                        onChange={(e) => setData('article_style', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.article_style} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Article'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.visit(brandRoutes.show(brand.id).url + '?tab=articles')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
