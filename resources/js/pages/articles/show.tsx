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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import brandRoutes from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, ArrowLeft, Package, Plus, Eye, Search, Trash2, Download, Camera, ChevronDown, X, ImageIcon, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Brand {
    id: number;
    name: string;
}

interface ArticleType {
    id: number;
    name: string;
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
    created_at: string;
    updated_at: string;
}

interface ArticleImage {
    id: number;
    article_id: number;
    article_style: string;
    size: string;
    image_path: string;
    image_name: string | null;
    created_at: string;
    updated_at: string;
}

interface AnnotationPoint {
    x: number;
    y: number;
    label: string;
}

interface ArticleAnnotation {
    id: number;
    article_style: string;
    size: string;
    name: string;
    annotations: AnnotationPoint[];
    reference_image_path: string;
    json_file_path: string;
    created_at: string;
    updated_at: string;
}

interface Article {
    id: number;
    article_style: string;
    description: string | null;
    article_type: ArticleType;
    measurements?: Measurement[];
    images?: ArticleImage[];
    created_at: string;
    updated_at: string;
}

interface Props {
    brand: Brand;
    article: Article;
    annotations?: ArticleAnnotation[];
}

export default function Show({ brand, article, annotations = [] }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [measurementToDelete, setMeasurementToDelete] = useState<{ id: number; code: string } | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<ArticleImage | null>(null);
    const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [articleAnnotations, setArticleAnnotations] = useState<ArticleAnnotation[]>(annotations);
    const [selectedAnnotation, setSelectedAnnotation] = useState<ArticleAnnotation | null>(null);
    const [annotationPreviewOpen, setAnnotationPreviewOpen] = useState(false);

    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

    // Update articleAnnotations when annotations prop changes
    useEffect(() => {
        setArticleAnnotations(annotations);
    }, [annotations]);

    // Clean up camera when dialog closes
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);
    };

    const handleTakeImage = () => {
        if (!selectedSize) {
            alert('Please select a size first');
            return;
        }
        setCameraError(null);
        setImageDialogOpen(true);
    };

    const startCamera = async () => {
        setIsCameraLoading(true);
        setCameraError(null);

        try {
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('NotSupported');
            }

            // Check if running in secure context (HTTPS or localhost)
            if (!window.isSecureContext) {
                throw new Error('InsecureContext');
            }

            // Request camera access - try different constraints
            let mediaStream: MediaStream;

            try {
                // First try with high resolution
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    }
                });
            } catch (e) {
                // Fallback to basic camera access
                console.log('High-res camera failed, trying basic:', e);
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
            }

            setStream(mediaStream);
            setIsCameraActive(true);

            // Use setTimeout to ensure video element is rendered
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().catch(err => {
                            console.error('Error playing video:', err);
                        });
                        setIsCameraLoading(false);
                    };
                    // Fallback if onloadedmetadata doesn't fire
                    setTimeout(() => {
                        if (isCameraLoading) {
                            setIsCameraLoading(false);
                        }
                    }, 2000);
                } else {
                    console.error('Video element not found');
                    setIsCameraLoading(false);
                }
            }, 100);

        } catch (err: any) {
            console.error('Error accessing camera:', err);

            // Provide specific error messages based on error type
            let errorMessage = 'Could not access camera. ';

            if (err.message === 'NotSupported') {
                errorMessage = 'Your browser does not support camera access. Please use Chrome, Firefox, or Edge.';
            } else if (err.message === 'InsecureContext') {
                errorMessage = 'Camera access requires HTTPS. Please access this site via https:// or localhost.';
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = 'Camera is in use by another application. Please close other apps using the camera and try again.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = 'Camera does not support the requested settings. Please try again.';
            } else if (err.name === 'AbortError') {
                errorMessage = 'Camera access was interrupted. Please try again.';
            } else {
                errorMessage += 'Please check permissions and try again.';
            }

            setCameraError(errorMessage);
            setIsCameraLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setIsFullscreen(false);
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Capture at full video resolution
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const imageData = canvasRef.current.toDataURL('image/jpeg', 0.95);
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const dataURLtoBlob = (dataURL: string): Blob => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleSaveImage = async () => {
        if (!capturedImage || !selectedSize) return;

        setIsUploading(true);

        const formData = new FormData();
        const blob = dataURLtoBlob(capturedImage);
        const file = new File([blob], `article_${article.id}_${selectedSize}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('image', file);
        formData.append('size', selectedSize);

        try {
            const response = await fetch(`/brands/${brand.id}/articles/${article.id}/images`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setImageDialogOpen(false);
                setCapturedImage(null);
                setSelectedSize(null);
                router.reload();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCloseImageDialog = () => {
        stopCamera();
        setCapturedImage(null);
        setImageDialogOpen(false);
        setIsFullscreen(false);
        setCameraError(null);
    };

    const handleDeleteImageClick = (image: ArticleImage) => {
        setImageToDelete(image);
        setDeleteImageDialogOpen(true);
    };

    const handleDeleteImageConfirm = async () => {
        if (!imageToDelete) return;

        try {
            const response = await fetch(`/brands/${brand.id}/articles/${article.id}/images/${imageToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setDeleteImageDialogOpen(false);
                setImageToDelete(null);
                router.reload();
            } else {
                alert('Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image');
        }
    };

    const handleDeleteClick = (measurement: Measurement) => {
        setMeasurementToDelete({ id: measurement.id, code: measurement.code });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (measurementToDelete) {
            router.delete(brandRoutes.articles.measurements.destroy({ brand: brand.id, article: article.id, measurement: measurementToDelete.id }).url, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setMeasurementToDelete(null);
                },
            });
        }
    };

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
                        <Button
                            variant="outline"
                            onClick={() => router.visit(brandRoutes.show(brand.id).url + '?tab=articles')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
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
                        <div className="grid gap-4 md:grid-cols-3">
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
                            {article.description && (
                                <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                        Description
                                    </p>
                                    <p className="text-base whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        {article.description}
                                    </p>
                                </div>
                            )}
                            {/* <div>
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
                            </div> */}
                        </div>

                        {/* Size and Take Image Buttons */}
                        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="min-w-[120px]">
                                            {selectedSize ? `Size: ${selectedSize}` : 'Select Size'}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {sizes.map((size) => (
                                            <DropdownMenuItem
                                                key={size}
                                                onClick={() => handleSizeSelect(size)}
                                                className={selectedSize === size ? 'bg-neutral-100 dark:bg-neutral-800' : ''}
                                            >
                                                {size}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    onClick={handleTakeImage}
                                    disabled={!selectedSize}
                                    className={!selectedSize ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Take Image
                                </Button>

                                {selectedSize && (
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Article: {article.article_style} | Size: {selectedSize}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Article Images Section */}
                {article.images && article.images.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Article Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {article.images.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <div className="aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                            <img
                                                src={`/storage/${image.image_path}`}
                                                alt={`${image.article_style} - ${image.size}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                            <a
                                                href={`/storage/${image.image_path}`}
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button variant="secondary" size="sm">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteImageClick(image)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="mt-1 text-center">
                                            <span className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                                {image.size}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Article Annotations Section */}
                {articleAnnotations && articleAnnotations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Article Annotations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {articleAnnotations.map((annotation) => (
                                    <div
                                        key={annotation.id}
                                        className="relative rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-neutral-50 dark:bg-neutral-900"
                                    >
                                        <div className="relative">
                                            <img
                                                src={`/storage/${annotation.reference_image_path}`}
                                                alt={`${annotation.article_style} - ${annotation.size}`}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                                }}
                                            />
                                            {/* Overlay annotation points */}
                                            {annotation.annotations && annotation.annotations.length > 0 && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {annotation.annotations.map((point, index) => (
                                                        <div
                                                            key={index}
                                                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                                        >
                                                            <div className="w-2 h-2 bg-red-500 border border-white rounded-full shadow-lg" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                    Size: {annotation.size}
                                                </span>
                                                <span className="text-xs text-neutral-500">
                                                    {annotation.annotations?.length || 0} points
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 truncate">
                                                {annotation.name}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setSelectedAnnotation(annotation);
                                                        setAnnotationPreviewOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={async () => {
                                                        if (confirm(`Delete annotation for size ${annotation.size}?`)) {
                                                            try {
                                                                const response = await fetch(`/article-registration/annotations/${annotation.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: {
                                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                                    },
                                                                });
                                                                if (response.ok) {
                                                                    setArticleAnnotations(prev => prev.filter(a => a.id !== annotation.id));
                                                                }
                                                            } catch (err) {
                                                                console.error('Delete failed:', err);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Measurements</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage measurements for this article
                        </p>
                    </div>
                    <Link href={brandRoutes.articles.measurements.create({ brand: brand.id, article: article.id }).url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Measurement
                        </Button>
                    </Link>
                </div>

                <div className="rounded-lg border border-sidebar-border bg-white dark:bg-neutral-900">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Measurement</TableHead>
                                <TableHead>Tol (+)</TableHead>
                                <TableHead>Tol (-)</TableHead>
                                <TableHead>Sizes</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {article.measurements && article.measurements.length > 0 ? (
                                article.measurements.map((measurement) => (
                                    <TableRow
                                        key={measurement.id}
                                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => router.visit(brandRoutes.articles.measurements.show({ brand: brand.id, article: article.id, measurement: measurement.id }).url)}
                                    >
                                        <TableCell className="font-medium">
                                            {measurement.code}
                                        </TableCell>
                                        <TableCell>{measurement.measurement}</TableCell>
                                        <TableCell>
                                            {measurement.tol_plus !== null ? measurement.tol_plus : (
                                                <span className="text-neutral-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {measurement.tol_minus !== null ? measurement.tol_minus : (
                                                <span className="text-neutral-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {measurement.sizes && measurement.sizes.length > 0 ? (
                                                <span className="text-sm">
                                                    {measurement.sizes.length} size{measurement.sizes.length !== 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(measurement.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(measurement.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div
                                                className="flex items-center justify-end gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* <Link href={brandRoutes.articles.measurements.show({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link> */}
                                                <Link href={brandRoutes.articles.measurements.edit({ brand: brand.id, article: article.id, measurement: measurement.id }).url}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(measurement);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                                        No measurements found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Measurement"
                    description={`Are you sure you want to delete measurement "${measurementToDelete?.code}"? This action cannot be undone and will permanently delete the measurement and all associated data.`}
                />

                {/* Delete Image Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteImageDialogOpen}
                    onOpenChange={setDeleteImageDialogOpen}
                    onConfirm={handleDeleteImageConfirm}
                    title="Delete Image"
                    description={`Are you sure you want to delete this image for size "${imageToDelete?.size}"? This action cannot be undone.`}
                />

                {/* Image Capture Dialog */}
                <Dialog open={imageDialogOpen} onOpenChange={handleCloseImageDialog}>
                    <DialogContent className={isFullscreen ? "max-w-[100vw] w-screen h-screen max-h-screen p-0 rounded-none" : "max-w-3xl"}>
                        {!isFullscreen && (
                            <DialogHeader>
                                <DialogTitle>Capture Image</DialogTitle>
                                <DialogDescription>
                                    Article: {article.article_style} | Size: {selectedSize}
                                </DialogDescription>
                            </DialogHeader>
                        )}

                        <div className={isFullscreen ? "w-full h-full flex flex-col" : "space-y-4"}>
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            {/* Hidden canvas for capturing */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Video element - always mounted but hidden when not active */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={!isCameraActive || capturedImage ? 'hidden' : (isFullscreen
                                    ? "flex-1 w-full h-full object-contain bg-black"
                                    : "w-full rounded-lg border border-neutral-200 dark:border-neutral-700 min-h-[300px]"
                                )}
                                style={isFullscreen && isCameraActive && !capturedImage ? { minHeight: 'calc(100vh - 180px)' } : {}}
                            />

                            {!capturedImage ? (
                                <>
                                    {isCameraLoading ? (
                                        <div className={`flex flex-col items-center justify-center gap-4 ${isFullscreen ? 'flex-1 bg-black' : 'py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg'}`}>
                                            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                                            <p className={isFullscreen ? "text-white" : "text-neutral-600 dark:text-neutral-400"}>
                                                Starting camera...
                                            </p>
                                        </div>
                                    ) : isCameraActive ? (
                                        <div className={`relative ${isFullscreen ? 'flex-1 flex flex-col bg-black' : ''}`}>
                                            {/* Fullscreen header bar */}
                                            {isFullscreen && (
                                                <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 text-white p-4 flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-semibold">Capture Image</h3>
                                                        <p className="text-sm text-gray-300">
                                                            Article: {article.article_style} | Size: {selectedSize}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={toggleFullscreen}
                                                        className="text-white hover:bg-white/20"
                                                    >
                                                        <Minimize2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Camera controls */}
                                            <div className={`flex justify-center gap-4 ${isFullscreen ? 'absolute bottom-0 left-0 right-0 bg-black/70 p-6' : 'mt-4'}`}>
                                                {!isFullscreen && (
                                                    <Button variant="outline" onClick={toggleFullscreen}>
                                                        <Maximize2 className="mr-2 h-4 w-4" />
                                                        Fullscreen
                                                    </Button>
                                                )}
                                                <Button onClick={captureImage} size={isFullscreen ? "lg" : "default"} className={isFullscreen ? "px-8" : ""}>
                                                    <Camera className="mr-2 h-5 w-5" />
                                                    Capture
                                                </Button>
                                                <Button variant={isFullscreen ? "secondary" : "outline"} onClick={stopCamera} size={isFullscreen ? "lg" : "default"}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
                                            {cameraError ? (
                                                <>
                                                    <X className="h-12 w-12 text-red-500" />
                                                    <p className="text-red-600 dark:text-red-400 text-center px-4">
                                                        {cameraError}
                                                    </p>
                                                    <Button onClick={startCamera}>
                                                        <Camera className="mr-2 h-4 w-4" />
                                                        Try Again
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-12 w-12 text-neutral-400" />
                                                    <p className="text-neutral-600 dark:text-neutral-400">
                                                        Choose how to capture the image
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <Button onClick={startCamera}>
                                                            <Camera className="mr-2 h-4 w-4" />
                                                            Use Camera
                                                        </Button>
                                                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                            <ImageIcon className="mr-2 h-4 w-4" />
                                                            Upload File
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => setCapturedImage(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {!isFullscreen && (
                            <DialogFooter>
                                <Button variant="outline" onClick={handleCloseImageDialog}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveImage}
                                    disabled={!capturedImage || isUploading}
                                >
                                    {isUploading ? 'Saving...' : 'Save Image'}
                                </Button>
                            </DialogFooter>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Annotation Preview Dialog */}
                <Dialog open={annotationPreviewOpen} onOpenChange={setAnnotationPreviewOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Annotation Details</DialogTitle>
                            <DialogDescription>
                                {selectedAnnotation?.name}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedAnnotation && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Reference Image with Points */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Reference Image:</h4>
                                        <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 inline-block">
                                            <img
                                                src={`/storage/${selectedAnnotation.reference_image_path}`}
                                                alt={selectedAnnotation.name}
                                                className="max-h-96 w-auto block"
                                            />
                                            {/* Overlay annotation points */}
                                            {selectedAnnotation.annotations && selectedAnnotation.annotations.length > 0 && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {selectedAnnotation.annotations.map((point, index) => (
                                                        <div
                                                            key={index}
                                                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                                        >
                                                            <div className="w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg" />
                                                            <span className="absolute left-4 top-0 text-xs bg-black/80 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                {point.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Annotation Details */}
                                    <div className="space-y-4">
                                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border">
                                            <h4 className="font-medium text-sm mb-3">Details:</h4>
                                            <div className="space-y-2 text-sm">
                                                <p><strong>Article Style:</strong> {selectedAnnotation.article_style}</p>
                                                <p><strong>Size:</strong> {selectedAnnotation.size}</p>
                                                <p><strong>Points:</strong> {selectedAnnotation.annotations?.length || 0}</p>
                                                <p><strong>Created:</strong> {selectedAnnotation.created_at}</p>
                                                <p><strong>Updated:</strong> {selectedAnnotation.updated_at}</p>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border">
                                            <h4 className="font-medium text-sm mb-3">Annotation Points:</h4>
                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                {selectedAnnotation.annotations?.map((point, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 text-xs py-1 border-b border-neutral-200 dark:border-neutral-800 last:border-0"
                                                    >
                                                        <span className="w-5 h-5 bg-red-500 rounded-full text-white text-center text-[10px] leading-5 flex-shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-medium">{point.label}</span>
                                                        <span className="text-neutral-400 ml-auto">
                                                            ({point.x.toFixed(4)}%, {point.y.toFixed(4)}%)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedAnnotation.json_file_path && (
                                            <a
                                                href={`/storage/${selectedAnnotation.json_file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                            >
                                                Download JSON File
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAnnotationPreviewOpen(false)}>
                                Close
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (selectedAnnotation && confirm('Delete this annotation?')) {
                                        try {
                                            const response = await fetch(`/article-registration/annotations/${selectedAnnotation.id}`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                },
                                            });
                                            if (response.ok) {
                                                setArticleAnnotations(prev => prev.filter(a => a.id !== selectedAnnotation.id));
                                                setAnnotationPreviewOpen(false);
                                                setSelectedAnnotation(null);
                                            }
                                        } catch (err) {
                                            console.error('Delete failed:', err);
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Annotation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}