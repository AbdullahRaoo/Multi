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
import purchaseOrderRoutes from '@/routes/purchase-orders';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, ArrowLeft } from 'lucide-react';

interface Brand {
    id: number;
    name: string;
}

interface ArticleType {
    id: number;
    name: string;
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
    country: string;
    brand: Brand;
    articles: PurchaseOrderArticle[];
    client_references: PurchaseOrderClientReference[];
    created_at: string;
    updated_at: string;
}

interface Props {
    purchaseOrder: PurchaseOrder;
}

export default function Show({ purchaseOrder }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Purchase Orders',
            href: purchaseOrderRoutes.index().url,
        },
        {
            title: purchaseOrder.po_number,
            href: purchaseOrderRoutes.show({ purchase_order: purchaseOrder.id }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase Order - ${purchaseOrder.po_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Purchase Order Details</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            View purchase order information
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => router.visit(purchaseOrderRoutes.index().url)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Link href={purchaseOrderRoutes.edit({ purchase_order: purchaseOrder.id }).url}>
                            <Button variant="outline">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    PO Number
                                </p>
                                <p className="text-base font-semibold">{purchaseOrder.po_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Date
                                </p>
                                <p className="text-base">
                                    {new Date(purchaseOrder.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Brand
                                </p>
                                <p className="text-base font-semibold">{purchaseOrder.brand?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Country
                                </p>
                                <p className="text-base">{purchaseOrder.country}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {purchaseOrder.articles && purchaseOrder.articles.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Article Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-sidebar-border bg-white dark:bg-neutral-900 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Article Type</TableHead>
                                            <TableHead>Article Style</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Color</TableHead>
                                            <TableHead>Order Quantity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseOrder.articles.map((article) => (
                                            <TableRow key={article.id}>
                                                <TableCell className="font-medium">
                                                    {article.article_type?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>{article.article_style}</TableCell>
                                                <TableCell>
                                                    {article.article_description ? (
                                                        <span className="line-clamp-2 max-w-xs">
                                                            {article.article_description}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {article.article_color || (
                                                        <span className="text-neutral-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{article.order_quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {purchaseOrder.client_references && purchaseOrder.client_references.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Reference Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-sidebar-border bg-white dark:bg-neutral-900 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reference Name</TableHead>
                                            <TableHead>Reference Number</TableHead>
                                            <TableHead>Email Address</TableHead>
                                            <TableHead>Email Subject</TableHead>
                                            <TableHead>Email Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchaseOrder.client_references.map((ref) => (
                                            <TableRow key={ref.id}>
                                                <TableCell className="font-medium">
                                                    {ref.reference_name}
                                                </TableCell>
                                                <TableCell>
                                                    {ref.reference_number || (
                                                        <span className="text-neutral-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {ref.reference_email_address || (
                                                        <span className="text-neutral-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {ref.email_subject || (
                                                        <span className="text-neutral-400">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {ref.email_date ? (
                                                        new Date(ref.email_date).toLocaleDateString()
                                                    ) : (
                                                        <span className="text-neutral-400">N/A</span>
                                                    )}
                                                </TableCell>
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

