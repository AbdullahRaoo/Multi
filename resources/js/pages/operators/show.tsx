import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import operatorRoutes from '@/routes/operators';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Pencil, ArrowLeft } from 'lucide-react';

interface Operator {
    id: number;
    full_name: string;
    employee_id: string;
    department: string | null;
    contact_number: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    operator: Operator;
}

export default function Show({ operator }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Operators',
            href: operatorRoutes.index().url,
        },
        {
            title: operator.full_name,
            href: operatorRoutes.show(operator.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Operator - ${operator.full_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Operator Details</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            View operator information
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={operatorRoutes.index().url}>
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <Link href={operatorRoutes.edit(operator.id).url}>
                            <Button>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Operator Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Full Name
                                </p>
                                <p className="text-base">{operator.full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Employee ID
                                </p>
                                <p className="text-base">{operator.employee_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Department
                                </p>
                                <p className="text-base">{operator.department || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Contact Number
                                </p>
                                <p className="text-base">{operator.contact_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Created At
                                </p>
                                <p className="text-base">
                                    {new Date(operator.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Updated At
                                </p>
                                <p className="text-base">
                                    {new Date(operator.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

