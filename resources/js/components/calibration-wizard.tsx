import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Ruler, Target, X, Trash2, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface CalibrationPoint {
    x: number;
    y: number;
}

interface Calibration {
    id: number;
    name: string;
    pixels_per_cm: number;
    reference_length_cm: number;
    is_active: boolean;
    created_at: string;
}

interface CalibrationWizardProps {
    onClose: () => void;
    onCalibrationSaved?: () => void;
}

export function CalibrationWizard({ onClose, onCalibrationSaved }: CalibrationWizardProps) {
    const [step, setStep] = useState<'camera' | 'mark' | 'save'>('camera');
    const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
    const [referenceLengthCm, setReferenceLengthCm] = useState(30);
    const [calibrationName, setCalibrationName] = useState('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Initialize camera
    useEffect(() => {
        if (step === 'camera') {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [step]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720 } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Could not access camera. Please check permissions.');
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Limit resolution to reduce size while maintaining quality
        const maxWidth = 1920;
        const maxHeight = 1080;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);

        // Compress more aggressively (0.7 quality instead of 0.9)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(imageDataUrl);
        stopCamera();
        setStep('mark');
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (calibrationPoints.length >= 2) {
            setError('Only 2 points are needed for calibration.');
            return;
        }

        const img = imageRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setCalibrationPoints([...calibrationPoints, { x, y }]);
        setError('');
    };

    const handleRemovePoint = (index: number) => {
        setCalibrationPoints(calibrationPoints.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (calibrationPoints.length !== 2) {
            setError('Please mark exactly 2 points on the reference object.');
            return;
        }

        if (referenceLengthCm <= 0) {
            setError('Reference length must be greater than 0.');
            return;
        }

        if (!calibrationName.trim()) {
            setError('Please enter a calibration name.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            console.log('Starting calibration save...');
            console.log('Points:', calibrationPoints);
            console.log('Reference length:', referenceLengthCm);
            console.log('Name:', calibrationName);
            
            // Get fresh CSRF token
            const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfTokenMeta?.getAttribute('content');
            
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            console.log('CSRF token:', csrfToken.substring(0, 20) + '...');
            
            const payload = {
                name: calibrationName,
                calibration_points: calibrationPoints.map(p => [p.x, p.y]), // Convert {x,y} to [x,y]
                reference_length_cm: referenceLengthCm,
            };
            
            console.log('Payload:', payload);
            console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
            
            const response = await fetch('/article-registration/calibration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin',
            });

            console.log('Calibration response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 500));
                
                // Check if it's a redirect to login
                if (text.includes('login') || text.includes('Login')) {
                    throw new Error('Session expired. Please refresh the page and try again.');
                }
                
                throw new Error('Server returned non-JSON response. Please refresh the page and try again.');
            }

            const data = await response.json();
            console.log('Calibration save result:', data);

            if (data.success) {
                onCalibrationSaved?.();
                onClose();
            } else {
                setError(data.message || 'Failed to save calibration.');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred while saving calibration.';
            setError(errorMsg);
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setCalibrationPoints([]);
        setStep('camera');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="bg-neutral-900 border-b border-neutral-800 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Ruler className="h-5 w-5" />
                            Camera Calibration
                        </h2>
                        <p className="text-sm text-neutral-400">
                            {step === 'camera' && 'Step 1: Position your reference object and capture'}
                            {step === 'mark' && 'Step 2: Click on the start and end of your reference distance'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-neutral-800">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {step === 'camera' && (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="max-h-[70vh] max-w-full rounded-lg"
                        />
                        {error && (
                            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}
                        <Button onClick={handleCapture} size="lg">
                            <Camera className="mr-2 h-5 w-5" />
                            Capture Reference Image
                        </Button>
                    </div>
                )}

                {step === 'mark' && capturedImage && (
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex-1 flex items-center justify-center bg-neutral-900 rounded-lg overflow-hidden">
                            <div className="relative inline-block">
                                <img
                                    ref={imageRef}
                                    src={capturedImage}
                                    alt="Calibration reference"
                                    className="max-h-[70vh] max-w-full cursor-crosshair"
                                    onClick={handleImageClick}
                                />
                                {calibrationPoints.map((point, index) => (
                                    <div
                                        key={index}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                    >
                                        <div className="w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg" />
                                        <span className="absolute left-6 top-0 bg-black text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                                            Point {index + 1}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemovePoint(index);
                                            }}
                                            className="absolute -right-2 -top-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                            <div className="space-y-2">
                                <Label htmlFor="referenceLength" className="text-white">Reference Length (cm)</Label>
                                <Input
                                    id="referenceLength"
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={referenceLengthCm}
                                    onChange={(e) => setReferenceLengthCm(parseFloat(e.target.value))}
                                    className="bg-neutral-800 border-neutral-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="calibrationName" className="text-white">Calibration Name</Label>
                                <Input
                                    id="calibrationName"
                                    type="text"
                                    value={calibrationName}
                                    onChange={(e) => setCalibrationName(e.target.value)}
                                    placeholder={`Calibration ${new Date().toLocaleDateString()}`}
                                    className="bg-neutral-800 border-neutral-700 text-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 text-sm text-red-400 max-w-2xl mx-auto w-full">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 max-w-2xl mx-auto w-full">
                            <Button variant="outline" onClick={handleRetake} className="flex-1">
                                Retake Photo
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={calibrationPoints.length !== 2 || isSaving}
                                className="flex-1"
                            >
                                {isSaving ? 'Saving...' : 'Save Calibration'}
                            </Button>
                        </div>

                        <div className="text-center text-neutral-400 text-sm">
                            Points marked: <strong className="text-white">{calibrationPoints.length}/2</strong>
                        </div>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

interface CalibrationManagerProps {
    onClose: () => void;
    onCalibrationChanged?: () => void;
}

export function CalibrationManager({ onClose, onCalibrationChanged }: CalibrationManagerProps) {
    const [calibrations, setCalibrations] = useState<Calibration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        console.log('CalibrationManager mounted');
        loadCalibrations();
    }, []);

    const loadCalibrations = async () => {
        console.log('Loading calibrations...');
        setIsLoading(true);
        try {
            const response = await fetch('/article-registration/calibrations');
            console.log('Calibrations response status:', response.status);
            const data = await response.json();
            console.log('Calibrations data:', data);
            if (data.success) {
                setCalibrations(data.calibrations);
            } else {
                console.error('Failed to load calibrations:', data);
            }
        } catch (err) {
            console.error('Failed to load calibrations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetActive = async (calibrationId: number) => {
        try {
            const response = await fetch(`/article-registration/calibrations/${calibrationId}/activate`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                await loadCalibrations();
                onCalibrationChanged?.();
            }
        } catch (err) {
            console.error('Failed to activate calibration:', err);
        }
    };

    const handleDelete = async (calibrationId: number) => {
        if (!confirm('Are you sure you want to delete this calibration?')) {
            return;
        }

        console.log('Deleting calibration:', calibrationId);

        try {
            const response = await fetch(`/article-registration/calibrations/${calibrationId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            console.log('Delete response status:', response.status);
            const data = await response.json();
            console.log('Delete response data:', data);

            if (data.success) {
                await loadCalibrations();
                onCalibrationChanged?.();
            } else {
                alert(data.message || 'Failed to delete calibration.');
            }
        } catch (err) {
            console.error('Failed to delete calibration:', err);
            alert('An error occurred while deleting the calibration.');
        }
    };

    if (showWizard) {
        return (
            <CalibrationWizard
                onClose={() => setShowWizard(false)}
                onCalibrationSaved={async () => {
                    await loadCalibrations();
                    onCalibrationChanged?.();
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Ruler className="h-5 w-5" />
                                Manage Calibrations
                            </CardTitle>
                            <CardDescription>
                                View, activate, or delete camera calibrations
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => setShowWizard(true)} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Create New Calibration
                    </Button>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-600"></div>
                        </div>
                    ) : calibrations.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">
                            No calibrations found. Create one to get started.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {calibrations.map((calibration) => (
                                <div
                                    key={calibration.id}
                                    className={`border rounded-lg p-4 ${
                                        calibration.is_active
                                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                            : 'border-neutral-200 dark:border-neutral-800'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium">{calibration.name}</h3>
                                                {calibration.is_active && (
                                                    <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                Scale: <strong>{calibration.pixels_per_cm.toFixed(2)} px/cm</strong> | 
                                                Reference: {calibration.reference_length_cm}cm
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                Created: {new Date(calibration.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {!calibration.is_active && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSetActive(calibration.id)}
                                                >
                                                    Activate
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(calibration.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
