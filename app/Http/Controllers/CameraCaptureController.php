<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CameraCaptureController extends Controller
{
    /**
     * Camera server base URL.
     */
    private const CAMERA_URL = 'http://127.0.0.1:5555';

    /**
     * Show the camera capture page for an article.
     */
    public function show(Request $request, Brand $brand, Article $article): Response
    {
        $article->load('articleType');

        return Inertia::render('articles/camera-capture', [
            'brand' => $brand,
            'article' => $article,
            'selectedSize' => $request->query('size', 'M'),
        ]);
    }

    /**
     * Proxy: Camera status — auto-starts the camera server if not running.
     * Returns `camera_url` so the frontend can connect directly for
     * stream / capture (avoids PHP session-locking & buffering issues).
     */
    public function status(): JsonResponse
    {
        // Quick health check — is camera server already running?
        try {
            $response = Http::timeout(2)->get(self::CAMERA_URL . '/api/status');
            if ($response->ok()) {
                // Clear stale lock file on success
                $lockFile = storage_path('app/camera_server.lock');
                if (file_exists($lockFile)) {
                    @unlink($lockFile);
                }
                $data = $response->json();
                $data['camera_url'] = self::CAMERA_URL; // Direct URL for stream/capture
                return response()->json($data);
            }
        } catch (\Exception $e) {
            // Server not reachable — attempt auto-start
        }

        // Auto-start the camera server in the background
        $started = $this->autoStartCameraServer();

        return response()->json([
            'status'       => $started ? 'starting' : 'offline',
            'camera_type'  => null,
            'current_mode' => 'other',
            'streaming'    => false,
            'auto_start'   => $started,
            'camera_url'   => self::CAMERA_URL,
            'message'      => $started
                ? 'Camera server is starting automatically...'
                : 'Could not start camera server.',
        ]);
    }

    /**
     * Proxy: Set camera mode (black/other).
     */
    public function setMode(Request $request): JsonResponse
    {
        try {
            $response = Http::timeout(5)
                ->post(self::CAMERA_URL . '/api/mode', $request->all());
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Camera server unreachable'], 503);
        }
    }

    // -----------------------------------------------------------------------
    // Auto-start helpers
    // -----------------------------------------------------------------------

    /**
     * Launch the Python camera server as a background process if not running.
     * Uses a time-based lock file to prevent duplicate launches.
     */
    private function autoStartCameraServer(): bool
    {
        $lockFile = storage_path('app/camera_server.lock');

        // Prevent duplicate launches within 30 seconds
        if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 30) {
            return true; // A previous launch is likely still in progress
        }

        $pythonExe = $this->findPythonExe();
        $script    = base_path('python' . DIRECTORY_SEPARATOR . 'camera_server.py');

        if (!$pythonExe || !file_exists($script)) {
            Log::warning('Camera auto-start: Python exe or script not found', [
                'python' => $pythonExe,
                'script' => $script,
            ]);
            return false;
        }

        @file_put_contents($lockFile, (string) time());

        try {
            if (PHP_OS_FAMILY === 'Windows') {
                // start /B spawns a detached background process on Windows
                $cmd = sprintf(
                    'start "" /B "%s" "%s"',
                    str_replace('/', '\\', $pythonExe),
                    str_replace('/', '\\', $script),
                );
                pclose(popen($cmd, 'r'));
            } else {
                $cmd = sprintf(
                    'nohup "%s" "%s" > /dev/null 2>&1 &',
                    $pythonExe,
                    $script,
                );
                exec($cmd);
            }

            Log::info('Camera server auto-start initiated');
            return true;
        } catch (\Exception $e) {
            Log::error('Camera auto-start failed: ' . $e->getMessage());
            @unlink($lockFile);
            return false;
        }
    }

    /**
     * Locate the Python executable — prefer project venv, fallback to system.
     */
    private function findPythonExe(): ?string
    {
        $candidates = PHP_OS_FAMILY === 'Windows'
            ? [
                base_path('.venv\\Scripts\\python.exe'),
                base_path('venv\\Scripts\\python.exe'),
            ]
            : [
                base_path('.venv/bin/python'),
                base_path('venv/bin/python'),
                base_path('.venv/bin/python3'),
            ];

        foreach ($candidates as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        // Fallback: system Python
        $systemPython = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
        exec("{$systemPython} --version 2>&1", $output, $code);

        return $code === 0 ? $systemPython : null;
    }
}
