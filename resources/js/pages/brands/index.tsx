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
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { type PaginatedData } from '@/types';
import { useState, useEffect, useCallback } from 'react';

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
    brands: PaginatedData<Brand>;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Brands',
        href: brandRoutes.index().url,
    },
];

export default function Index({ brands, filters }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<{ id: number; name: string } | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const handleDeleteClick = (brand: Brand) => {
        setBrandToDelete({ id: brand.id, name: brand.name });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (brandToDelete) {
            router.delete(brandRoutes.destroy(brandToDelete.id).url);
        }
    };

    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        
        if (search) params.set('search', search);

        router.get(brandRoutes.index().url + (params.toString() ? '?' + params.toString() : ''), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [search]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search, applyFilters]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Brands" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Brands</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage your brands
                        </p>
                    </div>
                    <Link href={brandRoutes.create().url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Brand
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                        <Input
                            type="text"
                            placeholder="Search by name or description..."
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
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {brands.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-neutral-500">
                                        No brands found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                brands.data.map((brand) => (
                                    <TableRow key={brand.id}>
                                        <TableCell className="font-medium">{brand.name}</TableCell>
                                        <TableCell>
                                            {brand.description ? (
                                                <span className="line-clamp-2">{brand.description}</span>
                                            ) : (
                                                <span className="text-neutral-400">No description</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(brand.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(brand.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={brandRoutes.show(brand.id).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={brandRoutes.edit(brand.id).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(brand)}
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

                {brands.links && brands.links.length > 3 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            Showing {brands.from} to {brands.to} of {brands.total} results
                        </div>
                        <div className="flex gap-2">
                            {brands.links.map((link, index) => (
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
                    title="Delete Brand"
                    description={`Are you sure you want to delete brand "${brandToDelete?.name}"? This action cannot be undone and will permanently delete the brand and all associated data.`}
                />
            </div>
        </AppLayout>
    );
}

