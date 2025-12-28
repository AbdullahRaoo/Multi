import { update } from '@/actions/App/Http/Controllers/MeasurementController';
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
}

interface Props {
    brand: Brand;
    article: Article;
    measurement: Measurement;
}

interface SizeSection {
    size: string;
    value: string;
    unit: string;
}

export default function Edit({ brand, article, measurement }: Props) {
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
            title: 'Edit Measurement',
            href: brandRoutes.articles.measurements.edit({ brand: brand.id, article: article.id, measurement: measurement.id }).url,
        },
    ];

    const [sizes, setSizes] = useState<SizeSection[]>(
        measurement.sizes && measurement.sizes.length > 0
            ? measurement.sizes.map((s) => ({
                  size: s.size,
                  value: s.value.toString(),
                  unit: s.unit,
              }))
            : [{ size: '', value: '', unit: 'cm' }],
    );

    const { data, setData, put, processing, errors } = useForm({
        code: measurement.code,
        measurement: measurement.measurement,
        tol_plus: measurement.tol_plus?.toString() || '',
        tol_minus: measurement.tol_minus?.toString() || '',
        sizes: sizes,
    });

    useEffect(() => {
        setData('sizes', sizes);
    }, [sizes, setData]);

    const addSizeSection = () => {
        setSizes([...sizes, { size: '', value: '', unit: 'cm' }]);
    };

    const removeSizeSection = (index: number) => {
        if (sizes.length > 1) {
            const newSizes = sizes.filter((_, i) => i !== index);
            setSizes(newSizes);
            setData('sizes', newSizes);
        }
    };

    const updateSizeSection = (index: number, field: keyof SizeSection, value: string) => {
        const newSizes = [...sizes];
        newSizes[index] = { ...newSizes[index], [field]: value };
        setSizes(newSizes);
        setData('sizes', newSizes);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Transform sizes to ensure numeric values
        const transformedSizes = sizes.map((size) => ({
            size: size.size,
            value: parseFloat(size.value) || 0,
            unit: size.unit,
        }));

        const formData = {
            code: data.code,
            measurement: data.measurement,
            tol_plus: data.tol_plus ? parseFloat(data.tol_plus as string) : null,
            tol_minus: data.tol_minus ? parseFloat(data.tol_minus as string) : null,
            sizes: transformedSizes,
        };

        put(update({ brand: brand.id, article: article.id, measurement: measurement.id }).url, {
            data: formData,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Measurement - ${article.article_style}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Measurement</h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Update measurement details for {article.article_style}</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Measurement Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Code *</Label>
                                    <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} required />
                                    <InputError message={errors.code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="measurement">Measurement *</Label>
                                    <Input
                                        id="measurement"
                                        value={data.measurement}
                                        onChange={(e) => setData('measurement', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.measurement} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tol_plus">Tol (+)</Label>
                                    <Input
                                        id="tol_plus"
                                        type="number"
                                        step="0.01"
                                        value={data.tol_plus}
                                        onChange={(e) => setData('tol_plus', e.target.value)}
                                    />
                                    <InputError message={errors.tol_plus} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tol_minus">Tol (-)</Label>
                                    <Input
                                        id="tol_minus"
                                        type="number"
                                        step="0.01"
                                        value={data.tol_minus}
                                        onChange={(e) => setData('tol_minus', e.target.value)}
                                    />
                                    <InputError message={errors.tol_minus} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Size Section *</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addSizeSection}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add More
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sizes.map((size, index) => (
                                <div
                                    key={index}
                                    className="grid items-end gap-4 border-b border-neutral-200 pb-4 md:grid-cols-4 dark:border-neutral-700"
                                >
                                    <div className="grid gap-2">
                                        <Label htmlFor={`size-${index}`}>Size *</Label>
                                        <Input
                                            id={`size-${index}`}
                                            value={size.size}
                                            onChange={(e) => updateSizeSection(index, 'size', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors[`sizes.${index}.size` as keyof typeof errors]} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor={`value-${index}`}>Value *</Label>
                                        <Input
                                            id={`value-${index}`}
                                            type="number"
                                            step="0.01"
                                            value={size.value}
                                            onChange={(e) => updateSizeSection(index, 'value', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors[`sizes.${index}.value` as keyof typeof errors]} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor={`unit-${index}`}>Unit *</Label>
                                        <Select value={size.unit} onValueChange={(value) => updateSizeSection(index, 'unit', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cm">cm</SelectItem>
                                                <SelectItem value="inches">inches</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors[`sizes.${index}.unit` as keyof typeof errors]} />
                                    </div>

                                    <div className="flex items-end">
                                        {sizes.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSizeSection(index)}
                                                className="w-full"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {errors.sizes && typeof errors.sizes === 'string' && <InputError message={errors.sizes} />}
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Measurement'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(brandRoutes.articles.show({ brand: brand.id, article: article.id }).url)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
