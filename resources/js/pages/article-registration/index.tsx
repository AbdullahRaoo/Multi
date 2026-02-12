import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ClipboardList, Lock, Eye, EyeOff, ShieldCheck, Image, ChevronRight, X, ZoomIn, Download, MousePointer2, Save, Trash2, Edit3, Ruler, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CalibrationManager } from '@/components/calibration-wizard';

interface ArticleStyle {
    id: number;
    article_style: string;
    brand_name: string;
}

interface ArticleImageData {
    id: number;
    image_path: string;
    image_name: string;
    size: string;
    created_at: string;
}

interface AnnotationPoint {
    x: number;
    y: number;
    label: string;
}

interface AnnotationData {
    id: number;
    name: string;
    annotations: AnnotationPoint[];
    target_distances?: Record<number, number>;
    article_style: string;
    size: string;
    reference_image_path?: string;
    json_file_path?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    hasPassword: boolean;
    articleStyles: ArticleStyle[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Article Registration',
        href: '/article-registration',
    },
];

export default function ArticleRegistrationIndex({ hasPassword, articleStyles }: Props) {
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Password verification states - always require password if one is set
    const [isVerified, setIsVerified] = useState(false);
    const [verifyPassword, setVerifyPassword] = useState('');
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Article Registration states
    const [selectedArticleId, setSelectedArticleId] = useState<string>('');
    const [selectedArticleStyle, setSelectedArticleStyle] = useState<string>('');
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [images, setImages] = useState<ArticleImageData[]>([]);
    const [isLoadingSizes, setIsLoadingSizes] = useState(false);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [showAnnotation, setShowAnnotation] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ArticleImageData | null>(null);

    // Annotation states
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [annotationPoints, setAnnotationPoints] = useState<AnnotationPoint[]>([]);
    const [existingAnnotation, setExistingAnnotation] = useState<AnnotationData | null>(null);
    const [annotationName, setAnnotationName] = useState('');
    const [targetDistances, setTargetDistances] = useState<Record<number, number>>({});
    const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
    const [editingPointIndex, setEditingPointIndex] = useState<number | null>(null);
    const [tempLabel, setTempLabel] = useState('');
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Zoom and pan states
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Calibration states
    const [activeCalibration, setActiveCalibration] = useState<{
        id: number;
        name: string;
        pixels_per_cm: number;
        reference_length_cm: number;
        created_at: string;
    } | null>(null);
    const [showCalibrationManager, setShowCalibrationManager] = useState(false);

    // Load active calibration on mount
    useEffect(() => {
        if (isVerified) {
            loadActiveCalibration();
        }
    }, [isVerified]);

    const loadActiveCalibration = async () => {
        try {
            const response = await fetch('/article-registration/calibration');
            const data = await response.json();
            if (data.success && data.calibration) {
                setActiveCalibration(data.calibration);
            }
        } catch (err) {
            console.error('Failed to load calibration:', err);
        }
    };

    // Zoom and pan keyboard/mouse handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isAnnotating) return;
            
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                setZoomLevel(prev => Math.min(prev + 0.25, 5));
            } else if (e.key === 'x' || e.key === 'X') {
                e.preventDefault();
                setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAnnotating]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Left click drag to pan (when not clicking on image for annotation)
        if (e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey))) { // Middle mouse, Alt+Left or Shift+Left click for pan
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPanPosition({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Scroll wheel zooming - no Ctrl required
        // Scroll UP (negative deltaY) = zoom OUT, Scroll DOWN (positive deltaY) = zoom IN
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.15 : -0.15; // Scroll down = zoom in, scroll up = zoom out
        setZoomLevel(prev => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        if (!/[a-zA-Z]/.test(pwd)) {
            return 'Password must contain at least one letter.';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
            return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?).';
        }
        return null;
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/article-registration/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ 
                    password,
                    current_password: hasPassword ? currentPassword : null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPassword('');
                setConfirmPassword('');
                setCurrentPassword('');
                setIsChangingPassword(false);
                router.reload();
            } else {
                setError(data.message || 'Failed to set password.');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError('');
        setIsVerifying(true);

        try {
            const response = await fetch('/article-registration/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ password: verifyPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsVerified(true);
                setVerifyPassword('');
            } else {
                setVerifyError(data.message || 'Incorrect password.');
            }
        } catch {
            setVerifyError('An error occurred. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleArticleStyleChange = async (articleId: string) => {
        setSelectedArticleId(articleId);
        const article = articleStyles.find(a => a.id.toString() === articleId);
        setSelectedArticleStyle(article?.article_style || '');
        setSelectedSize('');
        setImages([]);
        setShowAnnotation(false);
        setAvailableSizes([]);

        if (!articleId) return;

        setIsLoadingSizes(true);
        try {
            const response = await fetch(`/article-registration/articles/${articleId}/sizes`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setAvailableSizes(data.sizes || []);
            }
        } catch (err) {
            console.error('Failed to load sizes:', err);
        } finally {
            setIsLoadingSizes(false);
        }
    };

    const handleSizeChange = (size: string) => {
        setSelectedSize(size);
        setImages([]);
        setShowAnnotation(false);
        setExistingAnnotation(null);
        setAnnotationPoints([]);
        setAnnotationName('');
        setTargetDistances({});
    };

    const handleViewAnnotation = async () => {
        if (!selectedArticleId || !selectedSize) return;

        setIsLoadingImages(true);
        try {
            const response = await fetch(`/article-registration/articles/${selectedArticleId}/sizes/${selectedSize}/images`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setImages(data.images || []);
                setShowAnnotation(true);
                
                // Load existing annotation if available
                if (data.annotation) {
                    setExistingAnnotation(data.annotation);
                    setAnnotationPoints(data.annotation.annotations || []);
                    setAnnotationName(data.annotation.name || '');
                    setTargetDistances(data.annotation.target_distances || {});
                } else {
                    setExistingAnnotation(null);
                    setAnnotationPoints([]);
                    setAnnotationName('');
                    setTargetDistances({});
                }
            }
        } catch (err) {
            console.error('Failed to load images:', err);
        } finally {
            setIsLoadingImages(false);
        }
    };

    // Load existing annotation when an image is selected for annotation
    const loadExistingAnnotation = async (imageId: number) => {
        try {
            const response = await fetch(`/article-registration/annotations/${imageId}`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success && data.annotation) {
                setExistingAnnotation(data.annotation);
                setAnnotationPoints(data.annotation.annotations || []);
                setAnnotationName(data.annotation.name || '');
                setTargetDistances(data.annotation.target_distances || {});
            } else {
                setExistingAnnotation(null);
                setAnnotationPoints([]);
                setAnnotationName('');
                setTargetDistances({});
            }
        } catch (err) {
            console.error('Failed to load annotation:', err);
        }
    };

    // Start annotation mode for an image
    const handleStartAnnotation = async (image: ArticleImageData) => {
        setSelectedImage(image);
        setIsAnnotating(true);
        await loadExistingAnnotation(image.id);
    };

    // Handle click on image to add annotation point - EXACT precision
    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isAnnotating || !imageContainerRef.current || isPanning) return;

        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate EXACT percentage coordinates - no rounding for full accuracy
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Store with full precision (up to 6 decimal places for pixel-perfect accuracy)
        const newPoint: AnnotationPoint = {
            x: Math.round(x * 1000000) / 1000000, // 6 decimal places for precision
            y: Math.round(y * 1000000) / 1000000,
            label: `Point ${annotationPoints.length + 1}`,
        };

        setAnnotationPoints([...annotationPoints, newPoint]);
    };

    // Remove annotation point
    const handleRemovePoint = (index: number) => {
        setAnnotationPoints(annotationPoints.filter((_, i) => i !== index));
        if (editingPointIndex === index) {
            setEditingPointIndex(null);
            setTempLabel('');
        }
    };

    // Start editing a point label
    const handleStartEditLabel = (index: number) => {
        setEditingPointIndex(index);
        setTempLabel(annotationPoints[index].label);
    };

    // Save edited label
    const handleSaveLabel = () => {
        if (editingPointIndex !== null) {
            const updatedPoints = [...annotationPoints];
            updatedPoints[editingPointIndex].label = tempLabel;
            setAnnotationPoints(updatedPoints);
            setEditingPointIndex(null);
            setTempLabel('');
        }
    };

    // Save annotation to database
    const handleSaveAnnotation = async () => {
        if (!selectedImage || annotationPoints.length === 0) {
            alert('Please add at least one annotation point.');
            return;
        }

        setIsSavingAnnotation(true);
        try {
            const response = await fetch('/article-registration/annotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    article_id: parseInt(selectedArticleId),
                    article_image_id: selectedImage.id,
                    annotations: annotationPoints,
                    // target_distances are auto-calculated from keypoints and calibration in the backend
                    name: annotationName || `Annotation for ${selectedArticleStyle} - ${selectedSize}`,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Annotation saved successfully!');
                setExistingAnnotation(data.annotation);
            } else {
                alert(data.message || 'Failed to save annotation.');
            }
        } catch (err) {
            console.error('Failed to save annotation:', err);
            alert('Failed to save annotation.');
        } finally {
            setIsSavingAnnotation(false);
        }
    };

    // Delete annotation
    const handleDeleteAnnotation = async () => {
        if (!existingAnnotation) return;

        if (!confirm('Are you sure you want to delete this annotation?')) return;

        try {
            const response = await fetch(`/article-registration/annotations/${existingAnnotation.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setAnnotationPoints([]);
                setExistingAnnotation(null);
                setAnnotationName('');
                alert('Annotation deleted successfully!');
            } else {
                alert(data.message || 'Failed to delete annotation.');
            }
        } catch (err) {
            console.error('Failed to delete annotation:', err);
            alert('Failed to delete annotation.');
        }
    };

    // Close annotation mode
    const handleCloseAnnotation = () => {
        setIsAnnotating(false);
        setSelectedImage(null);
        setAnnotationPoints([]);
        setExistingAnnotation(null);
        setAnnotationName('');
        setEditingPointIndex(null);
        setTempLabel('');
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
    };

    // Show password setup form if no password is set (first time)
    if (!hasPassword) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Article Registration - Set Password" />
                <div className="flex h-full flex-1 items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle>Set Up One-Time Password</CardTitle>
                            <CardDescription>
                                Create a secure password to protect Article Registration. 
                                This password will be saved permanently - you won't need to enter it again.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Min 8 characters, include letters & special characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Setting...' : 'Set Password & Continue'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // Show change password form if user clicked change password
    if (isChangingPassword) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Article Registration - Change Password" />
                <div className="flex h-full flex-1 items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                                <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                            </div>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Enter your current password and set a new one.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Min 8 characters, include letters & special characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setError('');
                                            setPassword('');
                                            setConfirmPassword('');
                                            setCurrentPassword('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={isLoading}>
                                        {isLoading ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // Show password verification prompt - always required when password is set
    if (!isVerified && hasPassword) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Article Registration - Enter Password" />
                <div className="flex h-full flex-1 items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle>Enter Password</CardTitle>
                            <CardDescription>
                                Please enter your password to access Article Registration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleVerifyPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="verifyPassword">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="verifyPassword"
                                            type={showVerifyPassword ? 'text' : 'password'}
                                            value={verifyPassword}
                                            onChange={(e) => setVerifyPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="pr-10"
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                        >
                                            {showVerifyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {verifyError && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{verifyError}</p>
                                )}

                                <Button type="submit" className="w-full" disabled={isVerifying}>
                                    {isVerifying ? 'Verifying...' : 'Unlock'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // Show the main article registration content (password already set)
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Article Registration" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Article Registration</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Register and manage articles for quality control
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Calibration Status Badge */}
                        {activeCalibration ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                <Ruler className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <div className="text-sm">
                                    <span className="text-green-900 dark:text-green-100 font-medium">Calibrated</span>
                                    <span className="text-green-700 dark:text-green-300 ml-2">
                                        {activeCalibration.pixels_per_cm.toFixed(2)} px/cm
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                                    Not Calibrated
                                </span>
                            </div>
                        )}
                        
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                console.log('Calibrate button clicked');
                                setShowCalibrationManager(true);
                            }}
                        >
                            <Ruler className="mr-2 h-4 w-4" />
                            {activeCalibration ? 'Manage' : 'Calibrate'}
                        </Button>
                        
                        <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                            <Lock className="mr-2 h-4 w-4" />
                            Change Password
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Article Selection
                        </CardTitle>
                        <CardDescription>
                            Select an article style, then choose a size to view annotations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Article Style Dropdown */}
                        <div className="space-y-2">
                            <Label htmlFor="articleStyle">Article Style</Label>
                            <Select value={selectedArticleId} onValueChange={handleArticleStyleChange}>
                                <SelectTrigger id="articleStyle" className="w-full">
                                    <SelectValue placeholder="Select an article style..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {articleStyles.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No articles found
                                        </SelectItem>
                                    ) : (
                                        articleStyles.map((article) => (
                                            <SelectItem key={article.id} value={article.id.toString()}>
                                                {article.article_style} ({article.brand_name})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Size Dropdown - Only show when article is selected */}
                        {selectedArticleId && (
                            <div className="space-y-2">
                                <Label htmlFor="size">Size</Label>
                                {isLoadingSizes ? (
                                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600"></div>
                                        Loading sizes...
                                    </div>
                                ) : availableSizes.length === 0 ? (
                                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-600 dark:text-amber-400">
                                        No images have been captured for this article style yet. 
                                        Go to the article page and use "Take Image" to capture images first.
                                    </div>
                                ) : (
                                    <Select value={selectedSize} onValueChange={handleSizeChange}>
                                        <SelectTrigger id="size" className="w-full">
                                            <SelectValue placeholder="Select a size..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSizes.map((size) => (
                                                <SelectItem key={size} value={size}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}

                        {/* Article Annotation Button - Only show when size is selected */}
                        {selectedSize && (
                            <div className="space-y-2">
                                <Button 
                                    onClick={handleViewAnnotation}
                                    disabled={isLoadingImages}
                                    className="w-full sm:w-auto"
                                >
                                    {isLoadingImages ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Image className="mr-2 h-4 w-4" />
                                            Article Annotation
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Annotation Images Card - Only show when annotation is requested */}
                {showAnnotation && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Image className="h-5 w-5" />
                                        Article Annotation
                                    </CardTitle>
                                    <CardDescription>
                                        Images for {selectedArticleStyle} - Size {selectedSize}
                                    </CardDescription>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setShowAnnotation(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Show existing annotation reference image if available */}
                            {existingAnnotation && existingAnnotation.reference_image_path && (
                                <div className="mb-6 p-4 rounded-lg border-2 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-green-600" />
                                            <h3 className="font-semibold text-green-800 dark:text-green-400">
                                                Reference Image & Annotation Found
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // Start editing this annotation
                                                    if (images.length > 0) {
                                                        handleStartAnnotation(images[0]);
                                                    }
                                                }}
                                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit3 className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to delete this annotation?')) {
                                                        return;
                                                    }
                                                    
                                                    try {
                                                        const response = await fetch(`/article-registration/annotations/${existingAnnotation.id}`, {
                                                            method: 'DELETE',
                                                            headers: {
                                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                            },
                                                        });
                                                        
                                                        const data = await response.json();
                                                        
                                                        if (response.ok && data.success) {
                                                            setExistingAnnotation(null);
                                                            setAnnotationPoints([]);
                                                            setAnnotationName('');
                                                            alert('Annotation deleted successfully!');
                                                        } else {
                                                            alert(data.message || 'Failed to delete annotation. Please try again.');
                                                        }
                                                    } catch (err) {
                                                        console.error('Delete failed:', err);
                                                        alert('Error deleting annotation. Please check the console for details.');
                                                    }
                                                }}
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Reference Image:</p>
                                            <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 inline-block">
                                                <img
                                                    src={`/storage/${existingAnnotation.reference_image_path}`}
                                                    alt={`Reference - ${existingAnnotation.article_style}_${existingAnnotation.size}`}
                                                    className="max-h-64 w-auto block"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                {/* Overlay annotation points on reference image - positioned relative to the image */}
                                                {existingAnnotation.annotations && existingAnnotation.annotations.length > 0 && (
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {existingAnnotation.annotations.map((point, index) => (
                                                            <div
                                                                key={index}
                                                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                                                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                                            >
                                                                <div className="w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg" />
                                                                <span className="absolute left-4 top-0 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                    {point.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Annotation Details:</p>
                                            <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                                                <p className="text-sm"><strong>Name:</strong> {existingAnnotation.name}</p>
                                                <p className="text-sm"><strong>Article Style:</strong> {existingAnnotation.article_style}</p>
                                                <p className="text-sm"><strong>Size:</strong> {existingAnnotation.size}</p>
                                                <p className="text-sm"><strong>Points:</strong> {existingAnnotation.annotations?.length || 0}</p>
                                                <p className="text-sm"><strong>Created:</strong> {existingAnnotation.created_at}</p>
                                                <p className="text-sm"><strong>Updated:</strong> {existingAnnotation.updated_at}</p>
                                                {existingAnnotation.json_file_path && (
                                                    <p className="text-sm mt-2">
                                                        <strong>JSON File:</strong>{' '}
                                                        <a 
                                                            href={`/storage/${existingAnnotation.json_file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            Download
                                                        </a>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Annotation Points:</p>
                                                <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 max-h-32 overflow-y-auto">
                                                    {existingAnnotation.annotations?.map((point, index) => (
                                                        <div key={index} className="text-xs flex items-center gap-2 py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                                            <span className="w-4 h-4 bg-red-500 rounded-full text-white text-center text-[10px] leading-4 flex-shrink-0">
                                                                {index + 1}
                                                            </span>
                                                            <span className="font-medium">{point.label}</span>
                                                            <span className="text-neutral-400">({point.x.toFixed(4)}%, {point.y.toFixed(4)}%)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {images.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Image className="h-16 w-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                                    <h3 className="text-lg font-medium text-neutral-600 dark:text-neutral-400">
                                        No Images Found
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2 max-w-md">
                                        No images have been captured for this article style and size combination.
                                        Use the "Take Image" feature on the article page to capture images.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {images.map((image) => (
                                        <div 
                                            key={image.id} 
                                            className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-900"
                                        >
                                            <div className="aspect-square">
                                                <img
                                                    src={`/storage/${image.image_path}`}
                                                    alt={image.image_name}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => handleStartAnnotation(image)}
                                                    title="Annotate Image"
                                                >
                                                    <MousePointer2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedImage(image);
                                                        setIsAnnotating(false);
                                                    }}
                                                    title="View Image"
                                                >
                                                    <ZoomIn className="h-4 w-4" />
                                                </Button>
                                                <a 
                                                    href={`/storage/${image.image_path}`} 
                                                    download={image.image_name}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="secondary" size="icon" title="Download">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            </div>
                                            <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
                                                <p className="text-xs text-neutral-500 truncate" title={image.image_name}>
                                                    {image.image_name}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    {image.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Image Preview Modal (Simple View) */}
                {selectedImage && !isAnnotating && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div 
                            className="relative max-h-[90vh] max-w-[90vw]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute -top-12 right-0"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <img
                                src={`/storage/${selectedImage.image_path}`}
                                alt={selectedImage.image_name}
                                className="max-h-[85vh] max-w-full rounded-lg object-contain"
                            />
                            <div className="mt-2 text-center text-white">
                                <p className="text-sm">{selectedImage.image_name}</p>
                                <p className="text-xs text-neutral-400">{selectedImage.created_at}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Annotation Modal */}
                {selectedImage && isAnnotating && (
                    <div className="fixed inset-0 z-50 flex bg-black/90">
                        {/* Left Panel - Image with annotation points */}
                        <div className="flex-1 flex flex-col p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-white">
                                    <h2 className="text-lg font-semibold">Annotate Image</h2>
                                    <p className="text-sm text-neutral-400">
                                        {selectedArticleStyle} - Size {selectedSize}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-neutral-800 rounded-lg px-2 py-1">
                                        <span className="text-neutral-400 text-xs">Zoom:</span>
                                        <span className="text-white text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleCloseAnnotation}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div 
                                ref={imageContainerRef}
                                className="flex-1 flex items-center justify-center relative overflow-hidden"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onWheel={handleWheel}
                                style={{ cursor: isPanning ? 'grabbing' : 'default' }}
                            >
                                <div 
                                    className="relative inline-block"
                                    style={{
                                        transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                                        transformOrigin: 'center center',
                                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                                    }}
                                >
                                    <img
                                        src={`/storage/${selectedImage.image_path}`}
                                        alt={selectedImage.image_name}
                                        className="max-h-[calc(100vh-200px)] max-w-full object-contain cursor-crosshair rounded-lg"
                                        onClick={handleImageClick}
                                        draggable={false}
                                    />
                                    {/* Render annotation points - small dots */}
                                    {annotationPoints.map((point, index) => (
                                        <div
                                            key={index}
                                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                            style={{
                                                left: `${point.x}%`,
                                                top: `${point.y}%`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditLabel(index);
                                            }}
                                        >
                                            <div 
                                                className="w-3 h-3 bg-red-500 border border-white rounded-full shadow-lg hover:w-4 hover:h-4 transition-all"
                                                style={{ transform: `scale(${1 / zoomLevel})` }}
                                            />
                                            <div 
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 text-white px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ transform: `scale(${1 / zoomLevel})`, transformOrigin: 'left center' }}
                                            >
                                                {index + 1}. {point.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-4 text-center text-neutral-400 text-xs space-y-1">
                                <p>Click on the image to add annotation points</p>
                                <p className="text-neutral-500">
                                    <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Scroll ↓</kbd> Zoom In &nbsp;
                                    <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Scroll ↑</kbd> Zoom Out &nbsp;
                                    <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Shift</kbd>+Drag Pan &nbsp;
                                    <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">R</kbd> Reset
                                </p>
                            </div>
                        </div>

                        {/* Right Panel - Annotation controls */}
                        <div className="w-80 bg-neutral-900 border-l border-neutral-800 p-4 flex flex-col">
                            <h3 className="text-white font-semibold mb-4">Annotation Details</h3>
                            
                            {/* Annotation Name */}
                            <div className="mb-4">
                                <Label htmlFor="annotationName" className="text-neutral-300 text-sm">
                                    Annotation Name
                                </Label>
                                <Input
                                    id="annotationName"
                                    value={annotationName}
                                    onChange={(e) => setAnnotationName(e.target.value)}
                                    placeholder={`Annotation for ${selectedArticleStyle}`}
                                    className="mt-1 bg-neutral-800 border-neutral-700 text-white"
                                />
                            </div>

                            {/* Points List */}
                            <div className="flex-1 overflow-y-auto">
                                <Label className="text-neutral-300 text-sm">
                                    Annotation Points ({annotationPoints.length})
                                </Label>
                                <div className="mt-2 space-y-2">
                                    {annotationPoints.length === 0 ? (
                                        <p className="text-neutral-500 text-sm">
                                            No points added yet. Click on the image to add points.
                                        </p>
                                    ) : (
                                        annotationPoints.map((point, index) => (
                                            <div
                                                key={index}
                                                className="bg-neutral-800 rounded-lg p-2 flex items-center gap-2"
                                            >
                                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {editingPointIndex === index ? (
                                                        <div className="flex gap-1">
                                                            <Input
                                                                value={tempLabel}
                                                                onChange={(e) => setTempLabel(e.target.value)}
                                                                className="h-7 text-xs bg-neutral-700 border-neutral-600"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveLabel();
                                                                    if (e.key === 'Escape') {
                                                                        setEditingPointIndex(null);
                                                                        setTempLabel('');
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7"
                                                                onClick={handleSaveLabel}
                                                            >
                                                                <Save className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white text-sm truncate">
                                                                {point.label}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6"
                                                                    onClick={() => handleStartEditLabel(index)}
                                                                >
                                                                    <Edit3 className="h-3 w-3 text-neutral-400" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6"
                                                                    onClick={() => handleRemovePoint(index)}
                                                                >
                                                                    <Trash2 className="h-3 w-3 text-red-400" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <p className="text-neutral-500 text-xs">
                                                        X: {point.x.toFixed(4)}%, Y: {point.y.toFixed(4)}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Auto-calculated Target Distances Info */}
                            {annotationPoints.length >= 2 && (
                                <div className="border-t border-neutral-700 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Ruler className="h-4 w-4 text-blue-400" />
                                        <h3 className="font-semibold text-white">Target Distances</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {/* Show saved target distances if available */}
                                        {existingAnnotation && Object.keys(targetDistances).length > 0 && (
                                            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3 mb-3">
                                                <p className="text-blue-400 text-xs font-semibold mb-2">Saved Target Distances (cm):</p>
                                                <div className="grid grid-cols-2 gap-1 text-xs">
                                                    {Object.entries(targetDistances).map(([pair, distance]) => (
                                                        <div key={pair} className="text-blue-300">
                                                            Pair {pair}: {distance} cm
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {activeCalibration ? (
                                            <>
                                                <p className="text-green-400 text-xs mb-3">
                                                    ✓ Target distances will be auto-calculated from keypoints using calibration ({activeCalibration.pixels_per_cm.toFixed(2)} px/cm)
                                                </p>
                                                <div className="text-neutral-400 text-xs space-y-1">
                                                    {Array.from({ length: Math.floor(annotationPoints.length / 2) }).map((_, index) => {
                                                        const pairNumber = index + 1;
                                                        const point1 = annotationPoints[index * 2];
                                                        const point2 = annotationPoints[index * 2 + 1];
                                                        return (
                                                            <div key={pairNumber} className="flex items-center gap-2">
                                                                <span className="text-neutral-300">Pair {pairNumber}:</span>
                                                                <span>{point1?.label || `P${index * 2 + 1}`} → {point2?.label || `P${index * 2 + 2}`}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3">
                                                <p className="text-amber-400 text-xs">
                                                    ⚠ No active calibration. Please calibrate the camera first to auto-calculate target distances.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 space-y-2">
                                {existingAnnotation && (
                                    <div className="text-xs text-neutral-400 mb-2">
                                        Last saved: {existingAnnotation.updated_at}
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    onClick={handleSaveAnnotation}
                                    disabled={annotationPoints.length === 0 || isSavingAnnotation}
                                >
                                    {isSavingAnnotation ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Annotation
                                        </>
                                    )}
                                </Button>
                                {existingAnnotation && (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={handleDeleteAnnotation}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Annotation
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setAnnotationPoints([])}
                                    disabled={annotationPoints.length === 0}
                                >
                                    Clear All Points
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Calibration Manager Modal */}
                {showCalibrationManager && (
                    <CalibrationManager
                        onClose={() => {
                            console.log('Closing CalibrationManager');
                            setShowCalibrationManager(false);
                        }}
                        onCalibrationChanged={loadActiveCalibration}
                    />
                )}
            </div>
        </AppLayout>
    );
}
