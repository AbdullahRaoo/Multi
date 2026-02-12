"""
MagicQC Camera Capture and Upload Script
=========================================

This script captures images from a MindVision camera and uploads them
to the MagicQC Laravel application via API.

Requirements:
    - Python 3.8+
    - opencv-python (cv2)
    - numpy
    - requests
    - mvsdk (MindVision SDK)

Usage:
    1. Generate an API key in Laravel: php artisan api:generate-key "Python Camera"
    2. Copy the API key to the API_KEY variable below
    3. Set the BASE_URL to your Laravel application URL
    4. Run the script: python camera_capture.py

Author: MagicQC
"""

import cv2
import numpy as np
import requests
import os
import sys
import time
from datetime import datetime
from typing import Optional, Tuple, List, Dict
from ctypes import c_ubyte

# ==================== CONFIGURATION ====================
# Set these values for your environment

# Laravel API base URL (no trailing slash)
BASE_URL = "http://127.0.0.1:8000"

# API Key - Generate with: php artisan api:generate-key "Python Camera"
API_KEY = "p7K2IY2aJYLGQ5rG8FjiqpogGtBTMvImUDGq25hKpUE8Gp3MtSxoG33DJ6mY0LOs"

# Default size if not specified
DEFAULT_SIZE = "M"

# Image quality for JPEG encoding (1-100)
JPEG_QUALITY = 95

# ==================== END CONFIGURATION ====================

# Try to import MindVision SDK
try:
    from mvsdk import *
    MVSDK_AVAILABLE = True
except ImportError:
    MVSDK_AVAILABLE = False
    print("⚠️  MindVision SDK (mvsdk) not available. Using webcam fallback.")


class MagicQCCameraCapture:
    """
    Camera capture and upload client for MagicQC.
    
    Captures images from MindVision camera (or webcam fallback)
    and uploads to Laravel API.
    """
    
    def __init__(self, base_url: str = BASE_URL, api_key: str = API_KEY):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {"X-API-Key": api_key}
        self.camera = None
        self.camera_obj = None
        self.DevInfo = None
        self.captured_image = None
        self.use_webcam = not MVSDK_AVAILABLE
        self.webcam = None
        self.use_test_pattern = False  # Fallback when no camera available
        
    def test_connection(self) -> bool:
        """Test API connection and authentication."""
        try:
            print("🔗 Testing API connection...")
            response = requests.get(
                f"{self.base_url}/api/camera/ping",
                headers=self.headers,
                timeout=10
            )
            data = response.json()
            
            if data.get('success'):
                print(f"✅ API connection successful!")
                print(f"   Server time: {data.get('server_time')}")
                print(f"   Authenticated: {data.get('authenticated')}")
                return data.get('authenticated', False)
            else:
                print(f"❌ API connection failed: {data.get('message')}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def get_articles(self) -> List[Dict]:
        """Fetch list of available articles from API."""
        try:
            response = requests.get(
                f"{self.base_url}/api/camera/articles",
                headers=self.headers,
                timeout=10
            )
            data = response.json()
            
            if data.get('success'):
                return data.get('articles', [])
            else:
                print(f"❌ Failed to fetch articles: {data.get('message')}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching articles: {e}")
            return []
    
    def upload_image(self, image: np.ndarray, article_id: int, size: str = DEFAULT_SIZE) -> Optional[Dict]:
        """
        Upload captured image to Laravel API.
        
        Args:
            image: numpy array (BGR format)
            article_id: ID of the article
            size: Size code (S, M, L, XL, XXL)
            
        Returns:
            Response data dict on success, None on failure
        """
        try:
            print(f"📤 Uploading image to article {article_id} (size: {size})...")
            
            # Encode image as JPEG
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]
            _, encoded = cv2.imencode('.jpg', image, encode_params)
            
            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"camera_capture_{timestamp}.jpg"
            
            # Prepare multipart form data
            files = {
                'image': (filename, encoded.tobytes(), 'image/jpeg')
            }
            data = {
                'article_id': article_id,
                'size': size
            }
            
            response = requests.post(
                f"{self.base_url}/api/camera/upload",
                headers=self.headers,
                files=files,
                data=data,
                timeout=60
            )
            
            result = response.json()
            
            if result.get('success'):
                print(f"✅ Image uploaded successfully!")
                print(f"   Image ID: {result.get('image', {}).get('id')}")
                print(f"   Path: {result.get('image', {}).get('image_path')}")
                return result
            else:
                print(f"❌ Upload failed: {result.get('message')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Upload error: {e}")
            return None
    
    def delete_image(self, image_id: int) -> bool:
        """
        Delete an image from the server.
        
        Args:
            image_id: ID of the image to delete
            
        Returns:
            True on success, False on failure
        """
        try:
            print(f"🗑️  Deleting image {image_id}...")
            
            response = requests.delete(
                f"{self.base_url}/api/camera/images/{image_id}",
                headers=self.headers,
                timeout=30
            )
            
            result = response.json()
            
            if result.get('success'):
                print(f"✅ Image deleted successfully!")
                return True
            else:
                print(f"❌ Delete failed: {result.get('message')}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Delete error: {e}")
            return False
    
    # ==================== CAMERA FUNCTIONS ====================
    
    def initialize_camera(self) -> bool:
        """Initialize MindVision camera or fallback to webcam or test pattern."""
        if self.use_webcam:
            return self._initialize_webcam()
        else:
            return self._initialize_mindvision()
    
    def _initialize_webcam(self) -> bool:
        """Initialize webcam as fallback."""
        print("📷 Initializing webcam...")
        self.webcam = cv2.VideoCapture(0)
        
        if not self.webcam.isOpened():
            print("❌ Could not open webcam! Using test pattern mode.")
            self.use_test_pattern = True
            return True  # Still return True to allow test pattern mode
        
        # Set resolution
        self.webcam.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.webcam.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        
        # Verify webcam is working
        ret, frame = self.webcam.read()
        if not ret or frame is None:
            print("❌ Webcam not providing frames! Using test pattern mode.")
            self.webcam.release()
            self.webcam = None
            self.use_test_pattern = True
            return True
        
        print("✅ Webcam initialized successfully")
        return True
    
    def _generate_test_pattern(self, width: int = 1920, height: int = 1080) -> np.ndarray:
        """Generate a test pattern image when no camera is available."""
        # Create a colorful test pattern
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Color bars
        colors = [
            (255, 255, 255),  # White
            (255, 255, 0),    # Cyan (BGR)
            (0, 255, 255),    # Yellow
            (0, 255, 0),      # Green
            (255, 0, 255),    # Magenta
            (255, 0, 0),      # Blue
            (0, 0, 255),      # Red
            (0, 0, 0),        # Black
        ]
        
        bar_width = width // len(colors)
        for i, color in enumerate(colors):
            x_start = i * bar_width
            x_end = (i + 1) * bar_width if i < len(colors) - 1 else width
            img[:, x_start:x_end] = color
        
        # Add timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(img, f"TEST PATTERN - {timestamp}", (50, 100),
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
        cv2.putText(img, f"TEST PATTERN - {timestamp}", (50, 100),
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2)
        
        # Add grid
        for x in range(0, width, 100):
            cv2.line(img, (x, 0), (x, height), (128, 128, 128), 1)
        for y in range(0, height, 100):
            cv2.line(img, (0, y), (width, y), (128, 128, 128), 1)
        
        # Add center crosshair
        center_x, center_y = width // 2, height // 2
        cv2.line(img, (center_x - 50, center_y), (center_x + 50, center_y), (0, 255, 0), 3)
        cv2.line(img, (center_x, center_y - 50), (center_x, center_y + 50), (0, 255, 0), 3)
        cv2.circle(img, (center_x, center_y), 30, (0, 255, 0), 2)
        
        return img
    
    def _initialize_mindvision(self) -> bool:
        """Initialize MindVision camera."""
        try:
            print("📷 Initializing MindVision camera...")
            CameraSdkInit(1)
            camera_list = CameraEnumerateDevice()
            
            if len(camera_list) == 0:
                print("❌ No camera found! Falling back to webcam.")
                self.use_webcam = True
                return self._initialize_webcam()
            
            print(f"✅ Found {len(camera_list)} camera(s)")
            self.DevInfo = camera_list[0]
            self.camera_obj = self._MindVisionCamera(self.DevInfo)
            
            if not self.camera_obj.open():
                print("❌ Failed to open camera! Falling back to webcam.")
                self.use_webcam = True
                return self._initialize_webcam()
            
            print("✅ MindVision camera initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Camera initialization failed: {e}")
            print("   Falling back to webcam...")
            self.use_webcam = True
            return self._initialize_webcam()
    
    class _MindVisionCamera:
        """Inner class for MindVision camera operations."""
        
        def __init__(self, DevInfo):
            self.DevInfo = DevInfo
            self.hCamera = 0
            self.cap = None
            self.pFrameBuffer = 0
            self.native_width = 0
            self.native_height = 0
        
        def open(self) -> bool:
            if self.hCamera > 0:
                return True
            
            try:
                self.hCamera = CameraInit(self.DevInfo, -1, -1)
            except CameraException as e:
                print(f"❌ CameraInit Failed: {e.message}")
                return False
            
            cap = CameraGetCapability(self.hCamera)
            
            self.native_width = cap.sResolutionRange.iWidthMax
            self.native_height = cap.sResolutionRange.iHeightMax
            print(f"📐 Native resolution: {self.native_width}x{self.native_height}")
            
            CameraSetIspOutFormat(self.hCamera, CAMERA_MEDIA_TYPE_MONO8)
            
            FrameBufferSize = self.native_width * self.native_height * 1
            self.pFrameBuffer = CameraAlignMalloc(FrameBufferSize, 16)
            
            CameraSetTriggerMode(self.hCamera, 0)
            CameraSetAeState(self.hCamera, 1)
            CameraSetAnalogGain(self.hCamera, 64)
            CameraPlay(self.hCamera)
            
            self.cap = cap
            print(f"📷 Camera: {self.DevInfo.GetFriendlyName()}")
            return True
        
        def close(self):
            if self.hCamera > 0:
                CameraUnInit(self.hCamera)
                self.hCamera = 0
            if self.pFrameBuffer != 0:
                CameraAlignFree(self.pFrameBuffer)
                self.pFrameBuffer = 0
        
        def grab(self) -> Optional[np.ndarray]:
            try:
                # Increased timeout from 200 to 1000ms for more reliable capture
                pRawData, FrameHead = CameraGetImageBuffer(self.hCamera, 1000)
                CameraImageProcess(self.hCamera, pRawData, self.pFrameBuffer, FrameHead)
                CameraReleaseImageBuffer(self.hCamera, pRawData)
                
                import platform
                if platform.system() == "Windows":
                    CameraFlipFrameBuffer(self.pFrameBuffer, FrameHead, 1)
                
                frame_data = (c_ubyte * FrameHead.uBytes).from_address(self.pFrameBuffer)
                frame = np.frombuffer(frame_data, dtype=np.uint8)
                frame = frame.reshape((FrameHead.iHeight, FrameHead.iWidth, 1))
                
                return frame
                
            except CameraException as e:
                if e.error_code != CAMERA_STATUS_TIME_OUT:
                    print(f"⚠️ Grab failed: {e.message}")
                return None
    
    def capture_image(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Capture image from camera with live preview.
        
        Returns:
            (success, image) tuple
        """
        if self.use_test_pattern:
            return self._capture_test_pattern()
        elif self.use_webcam:
            return self._capture_from_webcam()
        else:
            return self._capture_from_mindvision()
    
    def _capture_test_pattern(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Capture using test pattern (no camera available)."""
        print("\n" + "="*50)
        print("📸 TEST PATTERN MODE (No Camera)")
        print("="*50)
        print("Press SPACE/ENTER to capture, 'q' to cancel")
        
        # Create window
        window_name = "MagicQC Camera - TEST PATTERN - Press SPACE to capture"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        
        # Try to set fullscreen
        try:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        except:
            print("⚠️ Could not set fullscreen, using windowed mode")
            cv2.resizeWindow(window_name, 1280, 720)
        
        while True:
            # Generate test pattern with current timestamp
            frame = self._generate_test_pattern()
            
            # Add instructions overlay
            display = frame.copy()
            cv2.putText(display, "Press SPACE/ENTER to capture", (50, 200),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 4)
            cv2.putText(display, "Press SPACE/ENTER to capture", (50, 200),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 2)
            cv2.putText(display, "Press 'q' to cancel | Press 'F' to toggle fullscreen", (50, 260),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.imshow(window_name, display)
            
            key = cv2.waitKey(100) & 0xFF  # 100ms delay for test pattern
            if key in [32, 13]:  # SPACE or ENTER
                cv2.destroyAllWindows()
                cv2.waitKey(1)
                h, w = frame.shape[:2]
                print(f"✅ Test pattern captured: {w}x{h}")
                self.captured_image = frame
                return True, frame
            elif key == ord('q'):
                cv2.destroyAllWindows()
                cv2.waitKey(1)
                print("❌ Capture cancelled")
                return False, None
            elif key == ord('f') or key == ord('F'):
                # Toggle fullscreen
                try:
                    current = cv2.getWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN)
                    if current == cv2.WINDOW_FULLSCREEN:
                        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                        cv2.resizeWindow(window_name, 1280, 720)
                    else:
                        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                except:
                    pass
        
        return False, None
    
    def _capture_from_webcam(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Capture from webcam with preview."""
        print("\n" + "="*50)
        print("📸 WEBCAM CAPTURE MODE")
        print("="*50)
        print("Press SPACE/ENTER to capture, 'q' to cancel, 'F' for fullscreen")
        
        # Create window - use WINDOW_NORMAL for better compatibility
        window_name = "MagicQC Camera - Press SPACE to capture"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        
        # Try to set fullscreen, but don't fail if it doesn't work
        try:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        except:
            print("⚠️ Could not set fullscreen, using windowed mode")
            cv2.resizeWindow(window_name, 1280, 720)
        
        # Give webcam time to warm up
        for _ in range(5):
            self.webcam.read()
            cv2.waitKey(50)
        
        frame_count = 0
        while True:
            ret, frame = self.webcam.read()
            frame_count += 1
            
            if not ret or frame is None:
                if frame_count < 10:
                    # First few frames might fail, retry
                    cv2.waitKey(50)
                    continue
                # If webcam stops working, switch to test pattern
                print("⚠️ Webcam frame error, switching to test pattern")
                self.use_test_pattern = True
                cv2.destroyAllWindows()
                return self._capture_test_pattern()
            
            # Add instructions overlay
            display = frame.copy()
            h, w = display.shape[:2]
            
            # Semi-transparent bar at top
            overlay = display.copy()
            cv2.rectangle(overlay, (0, 0), (w, 100), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.5, display, 0.5, 0, display)
            
            cv2.putText(display, "Press SPACE/ENTER to capture", (20, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(display, f"Press 'q' to cancel | 'F' fullscreen | Resolution: {w}x{h}", (20, 80),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            cv2.imshow(window_name, display)
            
            # Use longer waitKey to ensure window updates
            key = cv2.waitKey(30) & 0xFF
            if key in [32, 13]:  # SPACE or ENTER
                cv2.destroyAllWindows()
                cv2.waitKey(1)  # Process destroy
                print(f"✅ Image captured: {w}x{h}")
                self.captured_image = frame
                return True, frame
            elif key == ord('q'):
                cv2.destroyAllWindows()
                cv2.waitKey(1)
                print("❌ Capture cancelled")
                return False, None
            elif key == ord('f') or key == ord('F'):
                # Toggle fullscreen
                try:
                    current = cv2.getWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN)
                    if current == cv2.WINDOW_FULLSCREEN:
                        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                        cv2.resizeWindow(window_name, 1280, 720)
                    else:
                        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                except:
                    pass
        
        return False, None
    
    def _capture_from_mindvision(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Capture from MindVision camera with preview."""
        print("\n" + "="*50)
        print("📸 MINDVISION CAMERA CAPTURE")
        print("="*50)
        print("Press ENTER to capture, 'q' to cancel, 'F' for fullscreen")
        
        # Create window
        window_name = "MagicQC Camera - Press ENTER to capture"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        
        # Start with a reasonable window size
        cv2.resizeWindow(window_name, 1280, 720)
        
        # Try to set fullscreen
        try:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        except:
            print("⚠️ Could not set fullscreen, using windowed mode")
        
        # Warm up camera - grab a few frames
        print("Warming up camera...")
        for i in range(5):
            self.camera_obj.grab()
            cv2.waitKey(100)
        
        frame_count = 0
        consecutive_failures = 0
        last_good_frame = None
        
        while True:
            frame = self.camera_obj.grab()
            frame_count += 1
            
            if frame is not None:
                consecutive_failures = 0
                last_good_frame = frame
                
                # Convert mono to BGR
                display_frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
                h, w = display_frame.shape[:2]
                
                # For fullscreen display, resize to fit screen while maintaining aspect
                screen_h, screen_w = 1080, 1920  # Common screen size
                scale = min(screen_w/w, screen_h/h)
                if scale < 1:
                    display_img = cv2.resize(display_frame, (int(w*scale), int(h*scale)))
                else:
                    display_img = display_frame.copy()
                
                # Add semi-transparent overlay bar
                dh, dw = display_img.shape[:2]
                overlay = display_img.copy()
                cv2.rectangle(overlay, (0, 0), (dw, 100), (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.5, display_img, 0.5, 0, display_img)
                
                # Add instructions
                cv2.putText(display_img, "Press ENTER to capture", (20, 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(display_img, f"Press 'q' to cancel | 'F' fullscreen | Resolution: {w}x{h}", (20, 80),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                cv2.imshow(window_name, display_img)
            else:
                consecutive_failures += 1
                # If many failures, but we had a good frame before, show that
                if last_good_frame is not None and consecutive_failures < 10:
                    display_frame = cv2.cvtColor(last_good_frame, cv2.COLOR_GRAY2BGR)
                    h, w = display_frame.shape[:2]
                    cv2.putText(display_frame, "Waiting for frame...", (20, 40),
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
                    cv2.imshow(window_name, display_frame)
                
                # If too many consecutive failures, switch to webcam
                if consecutive_failures > 50:
                    print("⚠️ MindVision camera not providing frames, switching to webcam")
                    cv2.destroyAllWindows()
                    self.use_webcam = True
                    return self._capture_from_webcam()
            
            key = cv2.waitKey(30) & 0xFF
            if key == 13:  # ENTER
                # Capture final frame
                final_frame = self.camera_obj.grab()
                if final_frame is None and last_good_frame is not None:
                    final_frame = last_good_frame  # Use last good frame if current fails
                    
                if final_frame is not None:
                    cv2.destroyAllWindows()
                    cv2.waitKey(1)
                    bgr_image = cv2.cvtColor(final_frame, cv2.COLOR_GRAY2BGR)
                    h, w = bgr_image.shape[:2]
                    print(f"✅ Image captured at: {w}x{h}")
                    self.captured_image = bgr_image
                    return True, bgr_image
                else:
                    print("⚠️ No frame available, please try again")
            elif key == ord('q'):
                cv2.destroyAllWindows()
                cv2.waitKey(1)
                print("❌ Capture cancelled")
                return False, None
            elif key == ord('f') or key == ord('F'):
                # Toggle fullscreen
                try:
                    current = cv2.getWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN)
                    if current == cv2.WINDOW_FULLSCREEN:
                        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                        cv2.resizeWindow(window_name, 1280, 720)
                    else:
                        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                except:
                    pass
        
        return False, None
    
    def close(self):
        """Clean up camera resources."""
        if self.webcam:
            self.webcam.release()
        if self.camera_obj:
            self.camera_obj.close()
        cv2.destroyAllWindows()
        print("📷 Camera closed")


def select_article(client: MagicQCCameraCapture) -> Optional[int]:
    """Interactive article selection."""
    articles = client.get_articles()
    
    if not articles:
        print("❌ No articles available. Please create articles in the web interface first.")
        return None
    
    print("\n" + "="*60)
    print("📋 AVAILABLE ARTICLES")
    print("="*60)
    
    for i, article in enumerate(articles, 1):
        print(f"  {i}. [{article['article_style']}] {article['brand_name']} - {article.get('description', 'No description')[:40]}")
    
    print("="*60)
    
    while True:
        try:
            choice = input("\nEnter article number (or 'q' to quit): ").strip()
            if choice.lower() == 'q':
                return None
            
            idx = int(choice) - 1
            if 0 <= idx < len(articles):
                selected = articles[idx]
                print(f"\n✅ Selected: {selected['article_style']} (ID: {selected['id']})")
                return selected['id']
            else:
                print("❌ Invalid selection. Please try again.")
        except ValueError:
            print("❌ Please enter a valid number.")


def select_size() -> str:
    """Interactive size selection."""
    sizes = ['S', 'M', 'L', 'XL', 'XXL']
    
    print("\n📏 SELECT SIZE:")
    for i, size in enumerate(sizes, 1):
        print(f"  {i}. {size}")
    
    while True:
        try:
            choice = input(f"\nEnter size number (default: {DEFAULT_SIZE}): ").strip()
            if not choice:
                return DEFAULT_SIZE
            
            idx = int(choice) - 1
            if 0 <= idx < len(sizes):
                return sizes[idx]
            else:
                print("❌ Invalid selection.")
        except ValueError:
            print("❌ Please enter a valid number.")


def main():
    """Main interactive capture and upload loop."""
    print("="*60)
    print("     MagicQC Camera Capture & Upload")
    print("="*60)
    print()
    
    # Initialize client
    client = MagicQCCameraCapture(BASE_URL, API_KEY)
    
    # Test API connection
    if not client.test_connection():
        print("\n❌ Failed to connect to API. Please check:")
        print("   1. Is the Laravel server running?")
        print("   2. Is the BASE_URL correct?")
        print("   3. Is the API_KEY valid?")
        return
    
    # Initialize camera
    if not client.initialize_camera():
        print("\n❌ Failed to initialize camera.")
        return
    
    try:
        while True:
            print("\n" + "-"*40)
            print("MAIN MENU")
            print("-"*40)
            print("  1. Capture and Upload Image")
            print("  2. List Articles")
            print("  3. View/Delete Images")
            print("  4. Test API Connection")
            print("  q. Quit")
            print("-"*40)
            
            choice = input("Select option: ").strip().lower()
            
            if choice == '1':
                # Select article
                article_id = select_article(client)
                if article_id is None:
                    continue
                
                # Select size
                size = select_size()
                
                # Capture image
                success, image = client.capture_image()
                if not success or image is None:
                    continue
                
                # Confirm upload
                confirm = input("\n📤 Upload this image? (y/n): ").strip().lower()
                if confirm == 'y':
                    result = client.upload_image(image, article_id, size)
                    if result:
                        print("\n🎉 Image uploaded successfully!")
                        print(f"   View at: {BASE_URL}/article-registration")
                else:
                    print("❌ Upload cancelled")
                    
            elif choice == '2':
                articles = client.get_articles()
                if articles:
                    print("\n📋 Articles:")
                    for a in articles:
                        print(f"   ID: {a['id']} | Style: {a['article_style']} | Brand: {a['brand_name']}")
            
            elif choice == '3':
                # View and delete images
                view_and_delete_images(client)
                        
            elif choice == '4':
                client.test_connection()
                
            elif choice == 'q':
                print("\n👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid option")
                
    finally:
        client.close()


def view_and_delete_images(client: MagicQCCameraCapture):
    """View images for an article and optionally delete them."""
    # Select article
    article_id = select_article(client)
    if article_id is None:
        return
    
    try:
        response = requests.get(
            f"{client.base_url}/api/camera/articles/{article_id}/images",
            headers=client.headers,
            timeout=10
        )
        data = response.json()
        
        if not data.get('success'):
            print(f"❌ Failed to fetch images: {data.get('message')}")
            return
        
        images = data.get('images', [])
        if not images:
            print("\n📷 No images found for this article.")
            return
        
        while True:
            print("\n" + "="*60)
            print(f"📷 IMAGES FOR ARTICLE: {data.get('article', {}).get('article_style')}")
            print("="*60)
            
            for i, img in enumerate(images, 1):
                created = img.get('created_at', 'Unknown')[:19].replace('T', ' ')
                print(f"  {i}. [{img['size']}] {img['image_name']} - {created}")
                print(f"     ID: {img['id']} | URL: {img['image_url']}")
            
            print("="*60)
            print("  Enter number to DELETE, 'v' + number to VIEW (e.g., v1)")
            print("  Press 'b' to go back")
            
            choice = input("\nSelect: ").strip().lower()
            
            if choice == 'b':
                break
            
            # View image
            if choice.startswith('v'):
                try:
                    idx = int(choice[1:]) - 1
                    if 0 <= idx < len(images):
                        img_url = images[idx]['image_url']
                        print(f"\n🔗 Opening: {img_url}")
                        import webbrowser
                        webbrowser.open(img_url)
                    else:
                        print("❌ Invalid selection")
                except ValueError:
                    print("❌ Invalid format. Use 'v1', 'v2', etc.")
                continue
            
            # Delete image
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(images):
                    img = images[idx]
                    confirm = input(f"\n⚠️  Delete image '{img['image_name']}'? (y/n): ").strip().lower()
                    if confirm == 'y':
                        if client.delete_image(img['id']):
                            # Remove from local list
                            images.pop(idx)
                            print("✅ Image deleted!")
                            if not images:
                                print("No more images for this article.")
                                break
                    else:
                        print("❌ Delete cancelled")
                else:
                    print("❌ Invalid selection")
            except ValueError:
                print("❌ Please enter a valid number")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()
