"""
MagicQC Camera Server
=====================
Flask-based HTTP server that bridges the MindVision industrial camera
to the web-based MagicQC dashboard via MJPEG streaming and REST API.

Usage:
    python camera_server.py

Endpoints:
    GET  /api/status   - Camera status
    POST /api/mode     - Set garment color mode (black/other)
    GET  /api/stream   - MJPEG live stream
    POST /api/capture  - Capture single frame (returns base64 JPEG)

Runs on http://localhost:5555
"""

import sys
import os
import time
import threading
import base64
import json
from datetime import datetime
import socket

import cv2
import numpy as np

# Add parent directory (project root) so we can import mvsdk
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, _project_root)
# Also ensure CWD is project root so SDK DLL resolution works
os.chdir(_project_root)

# PID file for process management (auto-start from Laravel)
PID_FILE = os.path.join(_project_root, 'storage', 'app', 'camera_server.pid')


def is_port_in_use(port):
    """Check if a TCP port is already bound."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def write_pid():
    """Write current PID to file for process management."""
    os.makedirs(os.path.dirname(PID_FILE), exist_ok=True)
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))


def remove_pid():
    """Remove PID file on shutdown."""
    try:
        os.remove(PID_FILE)
    except OSError:
        pass


# Try to import Flask
try:
    from flask import Flask, Response, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("=" * 60)
    print("ERROR: Flask and flask-cors are required.")
    print("Install them with:")
    print("  pip install flask flask-cors")
    print("=" * 60)
    sys.exit(1)

from ctypes import c_ubyte

# Try to import MindVision SDK
MINDVISION_AVAILABLE = False
try:
    from mvsdk import (
        CameraSdkInit, CameraEnumerateDevice, CameraInit,
        CameraGetCapability, CameraSetIspOutFormat, CameraAlignMalloc,
        CameraAlignFree, CameraSetTriggerMode, CameraPlay,
        CameraUnInit, CameraGetImageBuffer, CameraImageProcess,
        CameraReleaseImageBuffer, CameraFlipFrameBuffer,
        CameraSetAnalogGain, CameraSetAeState,
        CAMERA_MEDIA_TYPE_MONO8, CAMERA_STATUS_TIME_OUT,
        CameraException,
    )
    MINDVISION_AVAILABLE = True
    print("[INFO] MindVision SDK loaded successfully")
except Exception as e:
    print(f"[WARN] MindVision SDK not available: {e}")
    print("[INFO] Will use OpenCV webcam as fallback")

import platform


# ============================================================================
# Camera Wrapper Classes
# ============================================================================

class MindVisionCamera:
    """Wrapper for MindVision industrial camera using mvsdk."""

    def __init__(self):
        self.hCamera = 0
        self.pFrameBuffer = 0
        self.cap = None
        self.DevInfo = None
        self.is_open = False

    def open(self):
        if self.is_open:
            return True

        try:
            CameraSdkInit(1)
            camera_list = CameraEnumerateDevice()
            if len(camera_list) == 0:
                print("[ERROR] No MindVision camera found")
                return False

            self.DevInfo = camera_list[0]
            print(f"[INFO] Found camera: {self.DevInfo.GetFriendlyName()}")

            self.hCamera = CameraInit(self.DevInfo, -1, -1)
            self.cap = CameraGetCapability(self.hCamera)

            # Set output to MONO8 for efficient processing
            CameraSetIspOutFormat(self.hCamera, CAMERA_MEDIA_TYPE_MONO8)

            buf_size = (self.cap.sResolutionRange.iWidthMax *
                        self.cap.sResolutionRange.iHeightMax * 1)
            self.pFrameBuffer = CameraAlignMalloc(buf_size, 16)

            CameraSetTriggerMode(self.hCamera, 0)
            CameraPlay(self.hCamera)

            self.is_open = True
            print("[INFO] MindVision camera opened (MONO8 mode)")
            return True

        except CameraException as e:
            print(f"[ERROR] CameraInit failed ({e.error_code}): {e.message}")
            return False

    def close(self):
        if self.hCamera > 0:
            CameraUnInit(self.hCamera)
            self.hCamera = 0
        if self.pFrameBuffer != 0:
            CameraAlignFree(self.pFrameBuffer)
            self.pFrameBuffer = 0
        self.is_open = False

    def set_mode(self, mode):
        """Set gain and auto-exposure based on garment color."""
        if not self.is_open:
            return
        if mode == 'black':
            CameraSetAnalogGain(self.hCamera, 150)
            CameraSetAeState(self.hCamera, 0)  # AE OFF
            print("[INFO] Mode: BLACK (gain=150, AE=OFF)")
        else:
            CameraSetAnalogGain(self.hCamera, 64)
            CameraSetAeState(self.hCamera, 1)  # AE ON
            print("[INFO] Mode: OTHER (gain=64, AE=ON)")

    def grab(self):
        """Grab a single frame. Returns BGR numpy array or None."""
        if not self.is_open:
            return None
        try:
            pRawData, FrameHead = CameraGetImageBuffer(self.hCamera, 200)
            CameraImageProcess(self.hCamera, pRawData,
                               self.pFrameBuffer, FrameHead)
            CameraReleaseImageBuffer(self.hCamera, pRawData)

            if platform.system() == "Windows":
                CameraFlipFrameBuffer(self.pFrameBuffer, FrameHead, 1)

            frame_data = (c_ubyte * FrameHead.uBytes).from_address(
                self.pFrameBuffer)
            frame = np.frombuffer(frame_data, dtype=np.uint8)
            # Return grayscale directly — cv2.imencode handles it fine
            # and avoids expensive GRAY2BGR on 5456x2812 frames
            return frame.reshape((FrameHead.iHeight, FrameHead.iWidth))

        except CameraException as e:
            if e.error_code != CAMERA_STATUS_TIME_OUT:
                print(f"[ERROR] Grab failed ({e.error_code}): {e.message}")
            return None

    @property
    def camera_type(self):
        return "mindvision"


class WebcamCamera:
    """Fallback wrapper using OpenCV VideoCapture (standard webcam)."""

    def __init__(self, index=0):
        self.index = index
        self.cap = None
        self.is_open = False

    def open(self):
        if self.is_open:
            return True
        self.cap = cv2.VideoCapture(self.index, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            # Try without DirectShow
            self.cap = cv2.VideoCapture(self.index)
        if self.cap.isOpened():
            # Set resolution
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            self.is_open = True
            w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            print(f"[INFO] Webcam opened: {w}x{h}")
            return True
        print("[ERROR] Could not open webcam")
        return False

    def close(self):
        if self.cap:
            self.cap.release()
        self.is_open = False

    def set_mode(self, mode):
        """Webcam: adjust brightness/gain if possible."""
        if not self.is_open or not self.cap:
            return
        if mode == 'black':
            self.cap.set(cv2.CAP_PROP_BRIGHTNESS, 200)
            self.cap.set(cv2.CAP_PROP_GAIN, 150)
        else:
            self.cap.set(cv2.CAP_PROP_BRIGHTNESS, 128)
            self.cap.set(cv2.CAP_PROP_GAIN, 64)
        print(f"[INFO] Webcam mode: {mode.upper()}")

    def grab(self):
        """Grab a single frame. Returns BGR numpy array or None."""
        if not self.is_open or not self.cap:
            return None
        ret, frame = self.cap.read()
        return frame if ret else None

    @property
    def camera_type(self):
        return "webcam"


# ============================================================================
# Camera Server Application
# ============================================================================

app = Flask(__name__)
CORS(app, origins="*", expose_headers=[
    'X-Image-Width', 'X-Image-Height', 'X-Capture-Timestamp', 'X-Camera-Mode'
])  # Allow all origins; expose custom headers for browser JS

# Global state
camera = None
current_mode = 'other'
latest_frame = None
frame_lock = threading.Lock()
streaming = False
stream_thread = None
streaming_paused = False          # Pause streaming for exclusive capture
mode_changed_at = 0.0             # Timestamp of last mode change
MODE_SETTLE_TIME = 0.5            # Seconds to wait after mode change (per reference code)
capture_lock = threading.Lock()   # Prevent concurrent captures


def init_camera():
    """Initialize the best available camera."""
    global camera

    if MINDVISION_AVAILABLE:
        camera = MindVisionCamera()
        if camera.open():
            camera.set_mode(current_mode)
            return True
        print("[WARN] MindVision camera failed, trying webcam fallback...")

    camera = WebcamCamera(0)
    if camera.open():
        camera.set_mode(current_mode)
        return True

    print("[ERROR] No camera available!")
    camera = None
    return False


def stream_worker():
    """Background thread that continuously grabs frames for streaming."""
    global latest_frame, streaming
    while streaming and camera and camera.is_open:
        if streaming_paused:
            time.sleep(0.01)  # Yield camera access during capture
            continue
        frame = camera.grab()
        if frame is not None:
            with frame_lock:
                latest_frame = frame
        else:
            time.sleep(0.005)  # Brief pause only on failed grabs


def start_streaming():
    """Start the background frame-grabbing thread."""
    global streaming, stream_thread
    if streaming:
        return
    streaming = True
    stream_thread = threading.Thread(target=stream_worker, daemon=True)
    stream_thread.start()
    print("[INFO] Streaming started")


def stop_streaming():
    """Stop the background streaming thread."""
    global streaming
    streaming = False
    if stream_thread:
        stream_thread.join(timeout=2)
    print("[INFO] Streaming stopped")


def generate_mjpeg():
    """Generator that yields MJPEG frames for streaming."""
    prev_frame = None
    while streaming:
        with frame_lock:
            frame = latest_frame
        if frame is not None and frame is not prev_frame:
            _, jpeg = cv2.imencode('.jpg', frame,
                                   [cv2.IMWRITE_JPEG_QUALITY, 80])
            prev_frame = frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' +
                   jpeg.tobytes() + b'\r\n')
        else:
            time.sleep(0.01)  # Wait briefly if no new frame


# ============================================================================
# API Endpoints
# ============================================================================

@app.route('/api/status', methods=['GET'])
def status():
    """Return camera status."""
    return jsonify({
        'status': 'ready' if camera and camera.is_open else 'no_camera',
        'camera_type': camera.camera_type if camera else None,
        'current_mode': current_mode,
        'streaming': streaming,
        'server': 'MagicQC Camera Server v1.0',
    })


@app.route('/api/ping', methods=['GET'])
def ping():
    """Ultra-lightweight health check — no camera interaction."""
    return '', 200


@app.route('/api/mode', methods=['POST'])
def set_mode():
    """Set garment color mode (black or other)."""
    global current_mode, mode_changed_at, latest_frame
    data = request.get_json(silent=True) or {}
    mode = data.get('mode', 'other')

    if mode not in ('black', 'other'):
        return jsonify({'error': 'Invalid mode. Use "black" or "other".'}), 400

    current_mode = mode
    mode_changed_at = time.time()

    if camera and camera.is_open:
        camera.set_mode(mode)

    # Clear cached frame so streaming picks up fresh frames with new settings
    with frame_lock:
        latest_frame = None

    print(f"[INFO] Mode changed to '{mode}' — camera needs ~{MODE_SETTLE_TIME}s to stabilize")

    return jsonify({
        'success': True,
        'mode': current_mode,
        'settings': {
            'gain': 150 if mode == 'black' else 64,
            'auto_exposure': 'OFF' if mode == 'black' else 'ON',
        }
    })


@app.route('/api/stream', methods=['GET'])
def video_stream():
    """MJPEG live stream endpoint."""
    if not camera or not camera.is_open:
        return jsonify({'error': 'Camera not available'}), 503

    start_streaming()
    return Response(generate_mjpeg(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/capture', methods=['POST'])
def capture():
    """Capture a single high-quality frame and return as base64 JPEG.
    (Legacy endpoint — prefer /api/capture-jpeg for speed.)"""
    global current_mode, mode_changed_at, streaming_paused

    if not camera or not camera.is_open:
        return jsonify({'error': 'Camera not available'}), 503

    with capture_lock:
        data = request.get_json(silent=True) or {}
        req_mode = data.get('mode', current_mode)
        if req_mode in ('black', 'other') and req_mode != current_mode:
            current_mode = req_mode
            camera.set_mode(current_mode)
            mode_changed_at = time.time()

        # Stabilize
        elapsed = time.time() - mode_changed_at
        if 0 < elapsed < MODE_SETTLE_TIME:
            time.sleep(MODE_SETTLE_TIME - elapsed)

        # Pause streaming and do fresh grab
        streaming_paused = True
        time.sleep(0.03)
        try:
            camera.grab()  # flush
            camera.grab()  # flush
            frame = camera.grab()
        finally:
            streaming_paused = False

    if frame is None:
        return jsonify({'error': 'Failed to capture frame'}), 500

    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

    h, w = frame.shape[:2]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    return jsonify({
        'success': True,
        'image': b64,
        'width': w,
        'height': h,
        'mode': current_mode,
        'timestamp': timestamp,
        'camera_type': camera.camera_type,
    })


@app.route('/api/capture-jpeg', methods=['GET'])
def capture_jpeg():
    """High-quality capture — returns raw JPEG binary with metadata in headers.

    Uses the same pattern as the reference capture code:
      1. Apply / confirm camera mode settings
      2. Wait for sensor to stabilize (gain + auto-exposure)
      3. Flush stale frames from the camera buffer
      4. Grab a fresh frame
    """
    global current_mode, mode_changed_at, streaming_paused

    if not camera or not camera.is_open:
        return jsonify({'error': 'Camera not available'}), 503

    with capture_lock:
        # Accept optional mode parameter — frontend sends its expected mode
        # so we can verify / re-apply if needed.
        req_mode = request.args.get('mode', current_mode)
        if req_mode in ('black', 'other') and req_mode != current_mode:
            current_mode = req_mode
            camera.set_mode(current_mode)
            mode_changed_at = time.time()
            print(f"[CAPTURE] Mode force-set to '{current_mode}' via capture param")

        # Wait for mode to stabilize if recently changed (per reference code)
        elapsed = time.time() - mode_changed_at
        if 0 < elapsed < MODE_SETTLE_TIME:
            wait = MODE_SETTLE_TIME - elapsed
            print(f"[CAPTURE] Waiting {wait:.2f}s for mode to stabilize...")
            time.sleep(wait)

        # Pause streaming to get exclusive camera access
        streaming_paused = True
        time.sleep(0.03)  # Let current stream grab finish

        try:
            # Flush stale frames from camera buffer (2 discards)
            camera.grab()
            camera.grab()

            # Capture the actual frame — fresh from sensor with correct settings
            frame = camera.grab()
        finally:
            # Always resume streaming
            streaming_paused = False

    if frame is None:
        return jsonify({'error': 'Failed to capture frame'}), 500

    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    h, w = frame.shape[:2]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    return Response(
        jpeg.tobytes(),
        mimetype='image/jpeg',
        headers={
            'X-Image-Width': str(w),
            'X-Image-Height': str(h),
            'X-Capture-Timestamp': timestamp,
            'X-Camera-Mode': current_mode,
            'Cache-Control': 'no-cache',
        }
    )


@app.route('/api/preview', methods=['GET'])
def preview():
    """Return latest frame as a single JPEG image."""
    with frame_lock:
        frame = latest_frame

    if frame is None:
        # Try a direct grab
        if camera and camera.is_open:
            frame = camera.grab()

    if frame is None:
        return jsonify({'error': 'No frame available'}), 503

    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return Response(jpeg.tobytes(), mimetype='image/jpeg')


# ============================================================================
# Server Lifecycle
# ============================================================================

def cleanup():
    """Clean up camera resources."""
    stop_streaming()
    if camera:
        camera.close()
    print("[INFO] Camera closed. Server shutting down.")


if __name__ == '__main__':
    import atexit

    PORT = 5555

    # When auto-started by PHP (no console), stdout/stderr may be invalid
    # handles. Detect this and redirect to a log file to prevent crashes.
    _log_path = os.path.join(_project_root, 'storage', 'logs', 'camera_server.log')
    os.makedirs(os.path.dirname(_log_path), exist_ok=True)
    try:
        sys.stdout.flush()
    except OSError:
        _lf = open(_log_path, 'a', buffering=1)
        sys.stdout = _lf
        sys.stderr = _lf

    # Prevent duplicate instances on the same port
    if is_port_in_use(PORT):
        print(f"[INFO] Port {PORT} already in use \u2014 another instance is running.")
        sys.exit(0)

    print("=" * 60)
    print("  MagicQC Camera Server")
    print("=" * 60)

    # Write PID file for process management
    write_pid()
    atexit.register(remove_pid)

    if init_camera():
        print(f"[OK] Camera ready: {camera.camera_type}")
        # Auto-start streaming so frames are always warm for instant capture
        start_streaming()
    else:
        print("[WARN] No camera found. Server will report 'no_camera'.")

    atexit.register(cleanup)

    print(f"\n[SERVER] Starting on http://localhost:{PORT}")
    print(f"[SERVER] MJPEG stream: http://localhost:{PORT}/api/stream")
    print(f"[SERVER] Press Ctrl+C to stop\n")

    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
