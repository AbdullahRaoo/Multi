import cv2
import numpy as np
from mvsdk import *
import platform
import time

class SimpleImageCapture:
    def __init__(self):
        self.camera = None
        self.camera_obj = None
        self.DevInfo = None
        self.captured_image = None
        # NO ZOOM - we want original resolution
        self.zoom_factor = 1.0
        self.pan_x = 0
        self.pan_y = 0
        
    def initialize_camera(self):
        """Initialize the MindVision camera - SIMPLIFIED"""
        try:
            print("Initializing camera...")
            CameraSdkInit(1)
            camera_list = CameraEnumerateDevice()
            if len(camera_list) == 0:
                print("❌ No camera found!")
                return False
                
            print(f"✅ Found {len(camera_list)} camera(s)")
            self.DevInfo = camera_list[0]
            self.camera_obj = self.Camera(self.DevInfo)
            
            if not self.camera_obj.open():
                return False
                
            print("✅ Camera initialized successfully")
            return True
            
        except CameraException as e:
            print(f"❌ Camera initialization failed: {e}")
            return False

    class Camera(object):
        def __init__(self, DevInfo):
            super().__init__()
            self.DevInfo = DevInfo
            self.hCamera = 0
            self.cap = None
            self.pFrameBuffer = 0
            
        def open(self):
            if self.hCamera > 0:
                return True
                
            hCamera = 0
            try:
                hCamera = CameraInit(self.DevInfo, -1, -1)
            except CameraException as e:
                print(f"❌ CameraInit Failed: {e.message}")
                return False
            
            cap = CameraGetCapability(hCamera)
            
            # Get native camera resolution
            self.native_width = cap.sResolutionRange.iWidthMax
            self.native_height = cap.sResolutionRange.iHeightMax
            print(f"📐 Native resolution: {self.native_width}x{self.native_height}")
            
            # Set to mono output for simplicity
            CameraSetIspOutFormat(hCamera, CAMERA_MEDIA_TYPE_MONO8)
            
            FrameBufferSize = self.native_width * self.native_height * 1
            pFrameBuffer = CameraAlignMalloc(FrameBufferSize, 16)
            
            # Simple settings
            CameraSetTriggerMode(hCamera, 0)
            CameraSetAeState(hCamera, 1)
            CameraSetAnalogGain(hCamera, 64)
            CameraPlay(hCamera)
            
            self.hCamera = hCamera
            self.pFrameBuffer = pFrameBuffer
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
        
        def grab(self):
            hCamera = self.hCamera
            pFrameBuffer = self.pFrameBuffer
            
            try:
                pRawData, FrameHead = CameraGetImageBuffer(hCamera, 200)
                CameraImageProcess(hCamera, pRawData, pFrameBuffer, FrameHead)
                CameraReleaseImageBuffer(hCamera, pRawData)
                
                if platform.system() == "Windows":
                    CameraFlipFrameBuffer(pFrameBuffer, FrameHead, 1)
                
                frame_data = (c_ubyte * FrameHead.uBytes).from_address(pFrameBuffer)
                frame = np.frombuffer(frame_data, dtype=np.uint8)
                frame = frame.reshape((FrameHead.iHeight, FrameHead.iWidth, 1))
                
                print(f"📊 Grabbed frame: {FrameHead.iWidth}x{FrameHead.iHeight}")
                return frame
                
            except CameraException as e:
                if e.error_code != CAMERA_STATUS_TIME_OUT:
                    print(f"⚠️ Grab failed: {e.message}")
                return None

    def capture_original_resolution(self):
        """
        Capture image at ORIGINAL camera resolution (NO ZOOM)
        This matches the original reference image capture
        Returns: (success, image) tuple
        """
        print("\n" + "="*50)
        print("📸 CAPTURING AT ORIGINAL RESOLUTION")
        print("="*50)
        
        # First show live preview at original resolution
        print("Showing live preview... (Press Enter to capture, 'q' to cancel)")
        preview_result = self.show_original_preview()
        if not preview_result:
            print("Capture cancelled.")
            return False, None
        
        # Capture the image at ORIGINAL resolution
        print("\n⏳ Capturing image at original resolution...")
        frame = self.camera_obj.grab()
        
        if frame is not None:
            # Convert mono to BGR for display - NO ZOOM APPLIED
            self.captured_image = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
            
            # Get dimensions
            h, w = self.captured_image.shape[:2]
            
            print(f"✅ Image captured at ORIGINAL resolution: {w}x{h}")
            
            # Show brief preview
            preview = self.captured_image.copy()
            
            # Resize for display if too large (but save original)
            display_h, display_w = 800, 1200  # Reasonable display size
            if h > display_h or w > display_w:
                scale = min(display_h/h, display_w/w)
                new_h, new_w = int(h * scale), int(w * scale)
                display_img = cv2.resize(preview, (new_w, new_h))
                print(f"📱 Display preview resized to: {new_w}x{new_h} (original preserved)")
            else:
                display_img = preview
            
            # Add capture confirmation text
            cv2.putText(display_img, "✅ IMAGE CAPTURED", 
                      (50, 50), 
                      cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
            cv2.putText(display_img, f"Original Resolution: {w}x{h}", 
                      (50, 100), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(display_img, "Press any key to continue...", 
                      (50, 150), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1)
            
            cv2.imshow("Capture Result - Original Resolution", display_img)
            cv2.waitKey(2000)  # Show for 2 seconds
            cv2.destroyAllWindows()
            
            return True, self.captured_image
        else:
            print("❌ Capture failed!")
            return False, None

    def show_original_preview(self):
        """
        Show live preview at ORIGINAL resolution (like reference image capture)
        Returns: True if Enter pressed, False if cancelled
        """
        print("\n🔴 LIVE PREVIEW - ORIGINAL RESOLUTION")
        print("Press ENTER to capture, 'q' to cancel")
        
        cv2.namedWindow("Live Preview - ORIGINAL Resolution", cv2.WINDOW_NORMAL)
        
        while True:
            frame = self.camera_obj.grab()
            if frame is not None:
                # Convert to BGR for display
                display_frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
                h, w = display_frame.shape[:2]
                
                # Resize for display if too large (but keep original for capture)
                display_h, display_w = 800, 1200
                if h > display_h or w > display_w:
                    scale = min(display_h/h, display_w/w)
                    new_h, new_w = int(h * scale), int(w * scale)
                    display_frame = cv2.resize(display_frame, (new_w, new_h))
                    resolution_text = f"Preview: {new_w}x{new_h} (Original: {w}x{h})"
                else:
                    resolution_text = f"Original Resolution: {w}x{h}"
                
                # Add instructions
                cv2.putText(display_frame, "ORIGINAL RESOLUTION PREVIEW", 
                          (10, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(display_frame, "PRESS [ENTER] TO CAPTURE", 
                          (10, 60), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                cv2.putText(display_frame, resolution_text, 
                          (10, display_frame.shape[0] - 10), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                cv2.putText(display_frame, "Press 'q' to cancel", 
                          (10, 90), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                
                cv2.imshow("Live Preview - ORIGINAL Resolution", display_frame)
                
                key = cv2.waitKey(1) & 0xFF
                
                if key == 13:  # Enter key
                    cv2.destroyAllWindows()
                    return True
                elif key == ord('q') or key == ord('Q'):
                    cv2.destroyAllWindows()
                    return False
            else:
                print("⚠️ No frame from camera")
                break
        
        cv2.destroyAllWindows()
        return False

    def save_original_image(self, image=None, default_name=None):
        """
        Save the captured image at original resolution
        """
        if image is None:
            image = self.captured_image
            
        if image is None:
            print("❌ No image to save!")
            return None
        
        # Auto-generate filename with timestamp
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        if default_name:
            filename = f"{default_name}_{timestamp}.jpg"
        else:
            filename = f"original_resolution_{timestamp}.jpg"
        
        # Save at FULL original resolution
        success = cv2.imwrite(filename, image)
        if success:
            h, w = image.shape[:2]
            print(f"💾 Original resolution image saved: {filename}")
            print(f"📐 File size: {w}x{h} pixels")
            return filename
        else:
            print("❌ Failed to save image!")
            return None

    def capture_like_reference_image(self):
        """
        Capture image EXACTLY like the original reference image capture
        This matches the method used in the original annotation system
        """
        print("\n" + "="*60)
        print("📸 CAPTURING REFERENCE IMAGE (Like Original System)")
        print("="*60)
        
        # Step 1: Initialize camera
        print("\n[STEP 1/3] Initializing camera...")
        if not self.initialize_camera():
            print("❌ Cannot continue without camera!")
            return None
        
        try:
            # Step 2: Show preview and capture
            print("\n[STEP 2/3] Ready to capture...")
            print("Live preview starting...")
            
            # Capture using the SAME method as original reference capture
            success, image = self.capture_original_resolution()
            
            if not success:
                print("❌ Capture failed!")
                return None
            
            # Step 3: Save the image
            print("\n[STEP 3/3] Saving reference image...")
            filename = self.save_original_image(image, "reference")
            
            print(f"\n✅ REFERENCE IMAGE CAPTURED SUCCESSFULLY!")
            print(f"📁 Saved as: {filename}")
            print(f"📐 Resolution: {image.shape[1]}x{image.shape[0]}")
            print(f"🎯 Ready for annotation!")
            
            return filename
            
        finally:
            # Cleanup
            self.camera_obj.close()
            print("\n📷 Camera closed.")

    def match_original_capture_method(self):
        """
        This function matches EXACTLY what the original code does for reference capture
        """
        print("\n🔄 Using original reference capture method...")
        
        # This is what the original code does:
        # 1. camera_obj.grab() - gets raw mono frame
        # 2. cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR) - converts to color
        # 3. NO ZOOM applied to the saved image
        # 4. Saved as-is at original resolution
        
        frame = self.camera_obj.grab()
        if frame is not None:
            # EXACTLY like original: convert mono to BGR
            reference_image = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
            # Keep grayscale copy (like original does)
            reference_gray = frame.copy()
            
            h, w = reference_image.shape[:2]
            print(f"✅ Reference image captured: {w}x{h}")
            print("📊 This matches the original annotation system exactly")
            
            return True, reference_image, reference_gray
        else:
            print("❌ Capture failed!")
            return False, None, None

# SIMPLEST USAGE - Just like pressing Enter in original system
def capture_reference_image_simple():
    """
    Simplest possible: Press Enter, get reference image at original resolution
    Exactly matches the original annotation system capture
    """
    print("\n" + "="*60)
    print("📸 REFERENCE IMAGE CAPTURE")
    print("="*60)
    print("This captures images EXACTLY like the original annotation system")
    print("Images will be at ORIGINAL camera resolution (no zoom)")
    print("="*60)
    print("\nInstructions:")
    print("1. Camera initializes")
    print("2. Live preview shows")
    print("3. Press ENTER when ready")
    print("4. Image saves automatically")
    print("="*60)
    
    # Create capture object
    capture = SimpleImageCapture()
    
    # Run the capture (matches original reference capture)
    filename = capture.capture_like_reference_image()
    
    if filename:
        print(f"\n🎉 Success! Your reference image is ready for annotation.")
        print(f"📁 File: {filename}")
    else:
        print("\n❌ Capture failed! Check camera connection.")
    
    return filename

# Ultra-simple one-liner equivalent
def press_enter_for_reference_image():
    """Just press Enter to get a reference image"""
    return capture_reference_image_simple()

# Main entry point
if __name__ == "__main__":
    print("Reference Image Capture System")
    print("=" * 50)
    print("This system captures images at ORIGINAL resolution")
    print("(No zoom, matches the original annotation system)")
    print("=" * 50)
    
    # Just run the simple capture
    capture_reference_image_simple()