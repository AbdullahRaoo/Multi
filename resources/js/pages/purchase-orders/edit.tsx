import { update } from '@/actions/App/Http/Controllers/PurchaseOrderController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import purchaseOrderRoutes from '@/routes/purchase-orders';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
    article_description: string | null;
    article_type_id: number;
    article_type_name: string | null;
}

interface PurchaseOrderArticle {
    id: number;
    article_type_id: number;
    article_style: string;
    article_description: string | null;
    article_color: string | null;
    order_quantity: number;
    article_type: ArticleType;
}

interface PurchaseOrderClientReference {
    id: number;
    reference_name: string;
    reference_number: string | null;
    reference_email_address: string | null;
    email_subject: string | null;
    email_date: string | null;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    date: string;
    brand_id: number;
    country: string;
    status: string;
    brand: Brand;
    articles: PurchaseOrderArticle[];
    client_references: PurchaseOrderClientReference[];
}

interface Props {
    purchaseOrder: PurchaseOrder;
    brands: Brand[];
    articleTypes: ArticleType[];
}

interface ArticleSection {
    article_type_id: string;
    article_style: string;
    article_description: string;
    article_color: string;
    order_quantity: string;
}

interface ClientReferenceSection {
    reference_name: string;
    reference_number: string;
    reference_email_address: string;
    email_subject: string;
    email_date: string;
}

export default function Edit({ purchaseOrder, brands, articleTypes }: Props) {
    // Get today's date in YYYY-MM-DD format for max date restriction
    const today = new Date().toISOString().split('T')[0];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Purchase Orders',
            href: purchaseOrderRoutes.index().url,
        },
        {
            title: 'Edit Purchase Order',
            href: purchaseOrderRoutes.edit({ purchase_order: purchaseOrder.id }).url,
        },
    ];

    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>(purchaseOrder.brand_id.toString());
    const [articleSections, setArticleSections] = useState<ArticleSection[]>(
        purchaseOrder.articles && purchaseOrder.articles.length > 0
            ? purchaseOrder.articles.map((art) => ({
                  article_type_id: art.article_type_id.toString(),
                  article_style: art.article_style,
                  article_description: art.article_description || '',
                  article_color: art.article_color || '',
                  order_quantity: art.order_quantity.toString(),
              }))
            : [
                  {
                      article_type_id: '',
                      article_style: '',
                      article_description: '',
                      article_color: '',
                      order_quantity: '',
                  },
              ]
    );
    const [clientReferenceSections, setClientReferenceSections] = useState<ClientReferenceSection[]>(
        purchaseOrder.client_references && purchaseOrder.client_references.length > 0
            ? purchaseOrder.client_references.map((ref) => ({
                  reference_name: ref.reference_name,
                  reference_number: ref.reference_number || '',
                  reference_email_address: ref.reference_email_address || '',
                  email_subject: ref.email_subject || '',
                  email_date: ref.email_date || '',
              }))
            : [
                  {
                      reference_name: '',
                      reference_number: '',
                      reference_email_address: '',
                      email_subject: '',
                      email_date: '',
                  },
              ]
    );

    const { data, setData, processing, errors } = useForm({
        po_number: purchaseOrder.po_number,
        date: purchaseOrder.date,
        brand_id: purchaseOrder.brand_id.toString(),
        country: purchaseOrder.country,
        status: purchaseOrder.status || 'Pending',
        articles: articleSections,
        client_references: clientReferenceSections,
    });

    // Fetch articles when brand is selected
    useEffect(() => {
        if (selectedBrandId) {
            axios.get(`/brands/${selectedBrandId}/articles-for-po`)
                .then((response) => {
                    setArticles(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching articles:', error);
                    setArticles([]);
                });
        } else {
            setArticles([]);
        }
    }, [selectedBrandId]);

    // Update form data when sections change
    useEffect(() => {
        setData('articles', articleSections);
    }, [articleSections, setData]);

    useEffect(() => {
        setData('client_references', clientReferenceSections);
    }, [clientReferenceSections, setData]);

    const addArticleSection = () => {
        setArticleSections([
            ...articleSections,
            {
                article_type_id: '',
                article_style: '',
                article_description: '',
                article_color: '',
                order_quantity: '',
            },
        ]);
    };

    const removeArticleSection = (index: number) => {
        if (articleSections.length > 1) {
            setArticleSections(articleSections.filter((_, i) => i !== index));
        }
    };

    const updateArticleSection = (index: number, field: keyof ArticleSection, value: string) => {
        const newSections = [...articleSections];
        newSections[index] = { ...newSections[index], [field]: value };
        
        // Auto-populate article style and description when article is selected
        if (field === 'article_style' && value) {
            const selectedArticle = articles.find(a => a.article_style === value);
            if (selectedArticle) {
                newSections[index].article_type_id = selectedArticle.article_type_id.toString();
                newSections[index].article_description = selectedArticle.article_description || '';
            }
        }
        
        setArticleSections(newSections);
    };

    const addClientReferenceSection = () => {
        setClientReferenceSections([
            ...clientReferenceSections,
            {
                reference_name: '',
                reference_number: '',
                reference_email_address: '',
                email_subject: '',
                email_date: '',
            },
        ]);
    };

    const removeClientReferenceSection = (index: number) => {
        if (clientReferenceSections.length > 1) {
            setClientReferenceSections(clientReferenceSections.filter((_, i) => i !== index));
        }
    };

    const updateClientReferenceSection = (index: number, field: keyof ClientReferenceSection, value: string) => {
        const newSections = [...clientReferenceSections];
        newSections[index] = { ...newSections[index], [field]: value };
        setClientReferenceSections(newSections);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Transform data for submission
        const transformedArticles = articleSections.map(article => ({
            article_type_id: parseInt(article.article_type_id) || 0,
            article_style: article.article_style,
            article_description: article.article_description || null,
            article_color: article.article_color || null,
            order_quantity: parseInt(article.order_quantity) || 0,
        }));

        const transformedClientReferences = clientReferenceSections.map(ref => ({
            reference_name: ref.reference_name,
            reference_number: ref.reference_number || null,
            reference_email_address: ref.reference_email_address || null,
            email_subject: ref.email_subject || null,
            email_date: ref.email_date || null,
        }));

        router.put(update({ purchase_order: purchaseOrder.id }).url, {
            po_number: data.po_number,
            date: data.date,
            brand_id: parseInt(data.brand_id as string) || 0,
            country: data.country,
            status: data.status,
            articles: transformedArticles,
            client_references: transformedClientReferences,
        }, {
            preserveScroll: true,
        });
    };

    // Get available articles for selected brand, filtered by article type if selected
    const getAvailableArticles = (articleTypeId: string) => {
        if (!selectedBrandId) return [];
        let filtered = articles;
        if (articleTypeId) {
            filtered = articles.filter(a => a.article_type_id.toString() === articleTypeId);
        }
        return filtered;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Purchase Order - ${purchaseOrder.po_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Purchase Order</h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Update purchase order details
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 pb-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="po_number">PO Number *</Label>
                                    <Input
                                        id="po_number"
                                        value={data.po_number}
                                        onChange={(e) => setData('po_number', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.po_number} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        max={today}
                                        required
                                    />
                                    <InputError message={errors.date} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="brand_id">Brand *</Label>
                                    <Select
                                        value={data.brand_id as string}
                                        onValueChange={(value) => {
                                            setData('brand_id', value);
                                            setSelectedBrandId(value);
                                        }}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {brands.map((brand) => (
                                                <SelectItem key={brand.id} value={brand.id.toString()}>
                                                    {brand.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.brand_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country *</Label>
                                    <Input
                                        id="country"
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.country} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status as string}
                                        onValueChange={(value) => setData('status', value)}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Article Details *</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addArticleSection}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add More
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {articleSections.map((article, index) => (
                                <div key={index} className="grid gap-4 pb-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Article {index + 1}</h4>
                                        {articleSections.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeArticleSection(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor={`article_type_${index}`}>Article Type *</Label>
                                            <Select
                                                value={article.article_type_id}
                                                onValueChange={(value) => updateArticleSection(index, 'article_type_id', value)}
                                                required
                                            >
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
                                            <InputError message={errors[`articles.${index}.article_type_id` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`article_style_${index}`}>Article Style *</Label>
                                            <Select
                                                value={article.article_style}
                                                onValueChange={(value) => updateArticleSection(index, 'article_style', value)}
                                                required
                                                disabled={!selectedBrandId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={selectedBrandId ? "Select article style" : "Select brand first"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getAvailableArticles(article.article_type_id).map((art) => (
                                                        <SelectItem key={art.id} value={art.article_style}>
                                                            {art.article_style}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors[`articles.${index}.article_style` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor={`article_description_${index}`}>Article Description</Label>
                                            <textarea
                                                id={`article_description_${index}`}
                                                value={article.article_description}
                                                onChange={(e) => updateArticleSection(index, 'article_description', e.target.value)}
                                                rows={3}
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                readOnly
                                            />
                                            <InputError message={errors[`articles.${index}.article_description` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`article_color_${index}`}>Article Color</Label>
                                            <Input
                                                id={`article_color_${index}`}
                                                value={article.article_color}
                                                onChange={(e) => updateArticleSection(index, 'article_color', e.target.value)}
                                            />
                                            <InputError message={errors[`articles.${index}.article_color` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`order_quantity_${index}`}>Order Quantity *</Label>
                                            <Input
                                                id={`order_quantity_${index}`}
                                                type="number"
                                                min="1"
                                                value={article.order_quantity}
                                                onChange={(e) => updateArticleSection(index, 'order_quantity', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors[`articles.${index}.order_quantity` as keyof typeof errors]} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {errors.articles && typeof errors.articles === 'string' && (
                                <InputError message={errors.articles} />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Client Reference Details *</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addClientReferenceSection}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add More
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {clientReferenceSections.map((ref, index) => (
                                <div key={index} className="grid gap-4 pb-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Client Reference {index + 1}</h4>
                                        {clientReferenceSections.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeClientReferenceSection(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor={`reference_name_${index}`}>Reference Name *</Label>
                                            <Input
                                                id={`reference_name_${index}`}
                                                value={ref.reference_name}
                                                onChange={(e) => updateClientReferenceSection(index, 'reference_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors[`client_references.${index}.reference_name` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`reference_number_${index}`}>Reference Number</Label>
                                            <Input
                                                id={`reference_number_${index}`}
                                                value={ref.reference_number}
                                                onChange={(e) => updateClientReferenceSection(index, 'reference_number', e.target.value)}
                                            />
                                            <InputError message={errors[`client_references.${index}.reference_number` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`reference_email_${index}`}>Reference Email Address</Label>
                                            <Input
                                                id={`reference_email_${index}`}
                                                type="email"
                                                value={ref.reference_email_address}
                                                onChange={(e) => updateClientReferenceSection(index, 'reference_email_address', e.target.value)}
                                            />
                                            <InputError message={errors[`client_references.${index}.reference_email_address` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`email_subject_${index}`}>Email Subject</Label>
                                            <Input
                                                id={`email_subject_${index}`}
                                                value={ref.email_subject}
                                                onChange={(e) => updateClientReferenceSection(index, 'email_subject', e.target.value)}
                                            />
                                            <InputError message={errors[`client_references.${index}.email_subject` as keyof typeof errors]} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`email_date_${index}`}>Email Date</Label>
                                            <Input
                                                id={`email_date_${index}`}
                                                type="date"
                                                value={ref.email_date}
                                                onChange={(e) => updateClientReferenceSection(index, 'email_date', e.target.value)}
                                                max={today}
                                            />
                                            <InputError message={errors[`client_references.${index}.email_date` as keyof typeof errors]} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {errors.client_references && typeof errors.client_references === 'string' && (
                                <InputError message={errors.client_references} />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Purchase Order'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(purchaseOrderRoutes.index().url)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

