"""
Image Annotation Tool for MagicQC
This script provides OpenCV-based image annotation functionality
that integrates with the Laravel application.

Usage:
    python image_annotator.py
    python image_annotator.py <image_path> <article_style> <size>
"""

import cv2
import numpy as np
import json
import os
import time
import requests
from pathlib import Path

# API Configuration - Update this to match your Laravel server
API_BASE_URL = "http://localhost:8000"
API_KEY = "p7K2IY2aJYLGQ5rG8FjiqpogGtBTMvImUDGq25hKpUE8Gp3MtSxoG33DJ6mY0LOs"

# Storage path - path to Laravel storage/app/public
STORAGE_PATH = Path(__file__).parent.parent / "storage" / "app" / "public"


class ImageAnnotator:
    def __init__(self):
        self.keypoints = []
        self.target_distances = {}
        self.placement_box = []  # [x1, y1, x2, y2] for garment positioning
        self.image = None
        self.image_path = None
        self.article_style = None
        self.size = None
        
        # Annotation parameters
        self.corner_keypoints_count = 12  # First 12 points as corners
        self.zoom_factor = 1.0
        self.zoom_center = None
        self.pan_x = 0
        self.pan_y = 0
        
        # Display parameters
        self.keypoint_size = 8
        self.keypoint_border = 2
    
    def load_image(self, image_path):
        """Load an image from file"""
        try:
            self.image = cv2.imread(image_path)
            if self.image is not None:
                self.image_path = image_path
                print(f"[OK] Image loaded: {image_path}")
                print(f"[DIM] Image dimensions: {self.image.shape[1]}x{self.image.shape[0]}")
                return True
            else:
                print(f"[ERR] Failed to load image: {image_path}")
                return False
        except Exception as e:
            print(f"[ERR] Error loading image: {e}")
            return False
    
    def set_article_info(self, article_style, size):
        """Set article style and size for naming"""
        self.article_style = article_style
        self.size = size
        print(f"[INFO] Article Style: {article_style}, Size: {size}")
    
    def save_annotation(self, output_dir=None):
        """Save annotation data to JSON file with article style naming"""
        try:
            if not self.article_style or not self.size:
                print("[ERR] Article style and size must be set before saving!")
                return False
            
            # Create output directory: annotations/{article_style}/
            if output_dir is None:
                output_dir = STORAGE_PATH / "annotations" / self.article_style
            else:
                output_dir = Path(output_dir) / self.article_style
            
            os.makedirs(output_dir, exist_ok=True)
            
            # File naming: {article_style}_{size}.json and {article_style}_{size}.jpg
            file_base_name = f"{self.article_style}_{self.size}"
            
            # Save reference image
            image_filename = f"{file_base_name}.jpg"
            image_path = output_dir / image_filename
            cv2.imwrite(str(image_path), self.image)
            
            # Prepare annotation points in web-compatible format
            web_annotations = []
            for i, point in enumerate(self.keypoints):
                # Convert to percentage coordinates for web compatibility
                if self.image is not None:
                    h, w = self.image.shape[:2]
                    x_percent = (point[0] / w) * 100
                    y_percent = (point[1] / h) * 100
                else:
                    x_percent = point[0]
                    y_percent = point[1]
                
                web_annotations.append({
                    'x': round(x_percent, 2),
                    'y': round(y_percent, 2),
                    'label': f"Point {i + 1}",
                    'pixel_x': int(point[0]),
                    'pixel_y': int(point[1]),
                    'is_corner': i < self.corner_keypoints_count
                })
            
            # Create annotation data
            annotation_data = {
                'article_style': self.article_style,
                'size': self.size,
                'annotation_name': f"Annotation for {self.article_style} - {self.size}",
                'reference_image': f"annotations/{self.article_style}/{image_filename}",
                'image_dimensions': {
                    'width': self.image.shape[1] if self.image is not None else 0,
                    'height': self.image.shape[0] if self.image is not None else 0
                },
                'points': web_annotations,
                'total_points': len(self.keypoints),
                'corner_keypoints_count': self.corner_keypoints_count,
                'target_distances': self.target_distances,
                'placement_box': self.placement_box,
                'created_at': time.strftime('%Y-%m-%dT%H:%M:%S.000000Z'),
                'updated_at': time.strftime('%Y-%m-%dT%H:%M:%S.000000Z'),
            }
            
            # Save JSON file
            json_filename = f"{file_base_name}.json"
            json_path = output_dir / json_filename
            with open(json_path, 'w') as f:
                json.dump(annotation_data, f, indent=4)
            
            print(f"\n[SAVE] Annotation saved successfully!")
            print(f"[FILE] JSON file: {json_path}")
            print(f"[FILE] Reference image: {image_path}")
            print(f"[PTS] Saved {len(self.keypoints)} keypoints")
            if self.target_distances:
                print(f"[TGT] Saved {len(self.target_distances)} target distances")
            if self.placement_box:
                print(f"[BOX] Saved placement guide box")
            
            # Sync with Laravel database
            self.sync_to_database(web_annotations)
            
            return True
            
        except Exception as e:
            print(f"[ERR] Error saving annotation: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def sync_to_database(self, annotations):
        """Sync annotation data with Laravel database via API"""
        try:
            url = f"{API_BASE_URL}/api/annotations/sync"
            headers = {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            }
            data = {
                'article_style': self.article_style,
                'size': self.size,
                'name': f"Annotation for {self.article_style} - {self.size}",
                'annotations': annotations,
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"[SYNC] Database synced successfully!")
                else:
                    print(f"[WARN] Database sync failed: {result.get('message', 'Unknown error')}")
            else:
                print(f"[WARN] Database sync failed (HTTP {response.status_code})")
                
        except requests.exceptions.ConnectionError:
            print(f"[WARN] Could not connect to server for database sync. Files saved locally.")
        except Exception as e:
            print(f"[WARN] Database sync error: {e}. Files saved locally.")
    
    def load_annotation(self, article_style, size, annotations_dir=None):
        """Load annotation data from JSON file by article style and size"""
        try:
            if annotations_dir is None:
                annotations_dir = STORAGE_PATH / "annotations"
            else:
                annotations_dir = Path(annotations_dir)
            
            # Look for annotation file
            json_path = annotations_dir / article_style / f"{article_style}_{size}.json"
            
            if not json_path.exists():
                print(f"[INFO] No existing annotation found for {article_style} - {size}")
                return False
            
            with open(json_path, 'r') as f:
                annotation_data = json.load(f)
            
            self.article_style = annotation_data.get('article_style', article_style)
            self.size = annotation_data.get('size', size)
            self.target_distances = annotation_data.get('target_distances', {})
            self.placement_box = annotation_data.get('placement_box', [])
            
            # Convert string keys to integers for target_distances
            if self.target_distances:
                self.target_distances = {int(k): float(v) for k, v in self.target_distances.items()}
            
            # Load keypoints (convert from percentage back to pixels if needed)
            points = annotation_data.get('points', [])
            self.keypoints = []
            
            for point in points:
                if 'pixel_x' in point and 'pixel_y' in point:
                    # Use pixel coordinates directly
                    self.keypoints.append([point['pixel_x'], point['pixel_y']])
                else:
                    # Will need to convert from percentage after image is loaded
                    self.keypoints.append([point.get('x', 0), point.get('y', 0)])
            
            # Load reference image
            reference_image = annotation_data.get('reference_image', '')
            if reference_image:
                image_path = STORAGE_PATH / reference_image
                if image_path.exists():
                    self.load_image(str(image_path))
                    
                    # Convert percentage coordinates to pixels if needed
                    if points and 'pixel_x' not in points[0] and self.image is not None:
                        h, w = self.image.shape[:2]
                        self.keypoints = []
                        for point in points:
                            px = int((point.get('x', 0) / 100) * w)
                            py = int((point.get('y', 0) / 100) * h)
                            self.keypoints.append([px, py])
            
            print(f"[OK] Annotation loaded: {json_path}")
            print(f"[PTS] Loaded {len(self.keypoints)} keypoints")
            if self.target_distances:
                print(f"[TGT] Loaded {len(self.target_distances)} target distances")
            if self.placement_box:
                print(f"[BOX] Loaded placement guide box")
            
            return True
            
        except Exception as e:
            print(f"[ERR] Error loading annotation: {e}")
            return False
    
    def clear_annotation(self):
        """Clear current annotation data"""
        self.keypoints = []
        self.target_distances = {}
        self.placement_box = []
        print("[CLEAR] Annotation data cleared")
    
    def apply_zoom(self, image):
        """Apply zoom and pan to image for display"""
        if self.zoom_factor <= 1.0:
            return image
            
        h, w = image.shape[:2]
        
        # Calculate zoomed dimensions
        zoom_w = int(w / self.zoom_factor)
        zoom_h = int(h / self.zoom_factor)
        
        # Calculate region of interest
        if self.zoom_center is None:
            self.zoom_center = (w // 2, h // 2)
            
        center_x, center_y = self.zoom_center
        
        # Apply pan
        center_x += self.pan_x
        center_y += self.pan_y
        
        # Ensure center stays within bounds
        center_x = max(zoom_w // 2, min(center_x, w - zoom_w // 2))
        center_y = max(zoom_h // 2, min(center_y, h - zoom_h // 2))
        
        # Calculate ROI
        x1 = center_x - zoom_w // 2
        y1 = center_y - zoom_h // 2
        x2 = x1 + zoom_w
        y2 = y1 + zoom_h
        
        # Ensure ROI is within image bounds
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)
        
        # Extract and resize ROI
        roi = image[y1:y2, x1:x2]
        if roi.size > 0:
            zoomed = cv2.resize(roi, (w, h), interpolation=cv2.INTER_LINEAR)
            return zoomed
        
        return image
    
    def original_to_zoomed_coords(self, orig_x, orig_y, img_shape):
        """Convert original coordinates to zoomed display coordinates"""
        if self.zoom_factor <= 1.0:
            return int(orig_x), int(orig_y)
            
        h, w = img_shape[:2]
        zoom_w = w / self.zoom_factor
        zoom_h = h / self.zoom_factor
        
        if self.zoom_center is None:
            self.zoom_center = (w // 2, h // 2)
            
        center_x, center_y = self.zoom_center
        center_x += self.pan_x
        center_y += self.pan_y
        
        # Calculate ROI bounds
        x1 = max(0, center_x - zoom_w // 2)
        y1 = max(0, center_y - zoom_h // 2)
        
        # Convert to zoomed coordinates
        zoom_x = (orig_x - x1) * self.zoom_factor
        zoom_y = (orig_y - y1) * self.zoom_factor
        
        return int(zoom_x), int(zoom_y)
    
    def zoomed_to_original_coords(self, zoom_x, zoom_y, img_shape):
        """Convert zoomed display coordinates to original coordinates"""
        if self.zoom_factor <= 1.0:
            return zoom_x, zoom_y
            
        h, w = img_shape[:2]
        zoom_w = w / self.zoom_factor
        zoom_h = h / self.zoom_factor
        
        if self.zoom_center is None:
            self.zoom_center = (w // 2, h // 2)
            
        center_x, center_y = self.zoom_center
        center_x += self.pan_x
        center_y += self.pan_y
        
        # Calculate ROI bounds
        x1 = max(0, center_x - zoom_w // 2)
        y1 = max(0, center_y - zoom_h // 2)
        
        # Convert to original coordinates
        orig_x = x1 + zoom_x / self.zoom_factor
        orig_y = y1 + zoom_y / self.zoom_factor
        
        return int(orig_x), int(orig_y)
    
    def annotate_measurement_points(self):
        """
        Annotate measurement points on the loaded image
        """
        if self.image is None:
            print("[ERR] No image loaded! Please load an image first.")
            return False
        
        print("\n" + "="*60)
        print("IMAGE ANNOTATION")
        print("="*60)
        print(f"Article Style: {self.article_style}")
        print(f"Size: {self.size}")
        print("-"*60)
        print("Mark measurement points on the image.")
        print("Points will be measured in pairs: 1-2, 3-4, 5-6, etc.")
        print(f"NOTE: First {self.corner_keypoints_count} points = CORNER points (yellow)")
        print("      Remaining points = REGULAR points (green)")
        
        # Reset zoom and pan
        self.zoom_factor = 1.0
        self.zoom_center = None
        self.pan_x = 0
        self.pan_y = 0
        
        # Start with current keypoints or empty list
        temp_keypoints = self.keypoints.copy()
        image_copy = self.image.copy()
        
        def redraw_annotation(img, points):
            """Redraw all annotation points on image"""
            img[:] = self.image.copy()
            if self.zoom_factor > 1.0:
                img[:] = self.apply_zoom(img)
            
            for i, point in enumerate(points):
                # Convert original coordinates to zoomed coordinates for display
                disp_x, disp_y = self.original_to_zoomed_coords(point[0], point[1], img.shape)
                
                # Use different colors for corner vs regular points
                if i < self.corner_keypoints_count:  # Corner points
                    color = (0, 255, 255)  # Yellow for corners
                    point_type = "C"
                else:  # Regular points
                    color = (0, 255, 0)    # Green for regular
                    point_type = "R"
                
                # Draw keypoint
                cv2.circle(img, (disp_x, disp_y), self.keypoint_size, color, -1)
                cv2.circle(img, (disp_x, disp_y), self.keypoint_size + 2, (0, 0, 255), self.keypoint_border)
                
                # Draw point number with type
                cv2.putText(img, f"{i+1}({point_type})", 
                           (disp_x + 15, disp_y - 15), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 3)
                cv2.putText(img, f"{i+1}({point_type})", 
                           (disp_x + 15, disp_y - 15), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Draw info bar at top
            info_text = f"Style: {self.article_style} | Size: {self.size} | Points: {len(points)} | Zoom: {self.zoom_factor:.1f}x"
            cv2.rectangle(img, (0, 0), (img.shape[1], 30), (50, 50, 50), -1)
            cv2.putText(img, info_text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        def annotation_mouse_callback(event, x, y, flags, param):
            nonlocal image_copy, temp_keypoints
            
            # Convert coordinates from zoomed to original
            orig_x, orig_y = self.zoomed_to_original_coords(x, y, image_copy.shape)
            
            if event == cv2.EVENT_LBUTTONDOWN:
                # Add point in original coordinates
                temp_keypoints.append([orig_x, orig_y])
                
                # Redraw all points
                redraw_annotation(image_copy, temp_keypoints)
                point_type = "CORNER" if len(temp_keypoints) <= self.corner_keypoints_count else "REGULAR"
                print(f"[ADD] {point_type} Point {len(temp_keypoints)} at ({orig_x}, {orig_y})")
                
            elif event == cv2.EVENT_RBUTTONDOWN:
                # Right click to remove nearest point
                if temp_keypoints:
                    # Find nearest point
                    min_dist = float('inf')
                    nearest_idx = -1
                    for i, point in enumerate(temp_keypoints):
                        dist = np.sqrt((point[0] - orig_x)**2 + (point[1] - orig_y)**2)
                        if dist < min_dist:
                            min_dist = dist
                            nearest_idx = i
                    
                    if min_dist < 50:  # Within reasonable distance
                        removed_point = temp_keypoints.pop(nearest_idx)
                        redraw_annotation(image_copy, temp_keypoints)
                        point_type = "CORNER" if nearest_idx < self.corner_keypoints_count else "REGULAR"
                        print(f"[DEL] {point_type} Point {nearest_idx + 1} removed")
        
        # Create window
        window_name = f"Annotation: {self.article_style} - {self.size} (Press H for help)"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 1200, 800)
        cv2.setMouseCallback(window_name, annotation_mouse_callback)
        
        # Display initial
        redraw_annotation(image_copy, temp_keypoints)
        self.show_annotation_instructions(image_copy, window_name)
        
        print(f"\nAnnotation window opened. Mark points for measurement.")
        print("Press 'H' for help, 'S' to save, 'Q' to quit")
        
        while True:
            cv2.imshow(window_name, image_copy)
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('s') or key == ord('S'):  # Save annotation
                if len(temp_keypoints) >= 2:
                    self.keypoints = temp_keypoints
                    corner_count = min(self.corner_keypoints_count, len(temp_keypoints))
                    regular_count = max(0, len(temp_keypoints) - self.corner_keypoints_count)
                    
                    print(f"\n[OK] Annotation completed with {len(temp_keypoints)} keypoints")
                    print(f"[DIM] Corner points: {corner_count}, Regular points: {regular_count}")
                    
                    cv2.destroyAllWindows()
                    
                    # Ask if user wants to set target distances
                    set_targets = input("\nSet target distances for QC? (y/n): ").strip().lower()
                    if set_targets == 'y' or set_targets == 'yes':
                        self.set_target_distances()
                    
                    # Ask if user wants to add placement box
                    add_box = input("Add placement guide box? (y/n): ").strip().lower()
                    if add_box == 'y' or add_box == 'yes':
                        self.annotate_placement_box()
                    
                    # Save annotation
                    self.save_annotation()
                    break
                else:
                    print("[ERR] Need at least 2 keypoints for measurement!")
                    
            elif key == ord('c') or key == ord('C'):  # Clear last point
                if temp_keypoints:
                    temp_keypoints.pop()
                    redraw_annotation(image_copy, temp_keypoints)
                    print(f"[CLEAR] Last point cleared. Total points: {len(temp_keypoints)}")
                    
            elif key == ord('z') or key == ord('Z'):  # Zoom in
                self.zoom_factor = min(5.0, self.zoom_factor * 1.2)
                redraw_annotation(image_copy, temp_keypoints)
                print(f"[ZOOM] Zoom: {self.zoom_factor:.1f}x")
                
            elif key == ord('x') or key == ord('X'):  # Zoom out
                self.zoom_factor = max(1.0, self.zoom_factor / 1.2)
                redraw_annotation(image_copy, temp_keypoints)
                print(f"[ZOOM] Zoom: {self.zoom_factor:.1f}x")
                
            elif key == ord('r') or key == ord('R'):  # Reset zoom
                self.zoom_factor = 1.0
                self.zoom_center = None
                self.pan_x = 0
                self.pan_y = 0
                redraw_annotation(image_copy, temp_keypoints)
                print("[ZOOM] Zoom reset")
                
            # PAN CONTROLS - Arrow keys
            elif key == 81 or key == 2:  # Left arrow
                self.pan_x -= 30
                redraw_annotation(image_copy, temp_keypoints)
            elif key == 83 or key == 3:  # Right arrow
                self.pan_x += 30
                redraw_annotation(image_copy, temp_keypoints)
            elif key == 82 or key == 0:  # Up arrow
                self.pan_y -= 30
                redraw_annotation(image_copy, temp_keypoints)
            elif key == 84 or key == 1:  # Down arrow
                self.pan_y += 30
                redraw_annotation(image_copy, temp_keypoints)
            
            # WASD for pan as alternative
            elif key == ord('a') or key == ord('A'):
                self.pan_x -= 30
                redraw_annotation(image_copy, temp_keypoints)
            elif key == ord('d') or key == ord('D'):
                self.pan_x += 30
                redraw_annotation(image_copy, temp_keypoints)
            elif key == ord('w') or key == ord('W'):
                self.pan_y -= 30
                redraw_annotation(image_copy, temp_keypoints)
            elif key == ord('e') or key == ord('E'):  # Using E instead of S (which is save)
                self.pan_y += 30
                redraw_annotation(image_copy, temp_keypoints)
                    
            elif key == ord('h') or key == ord('H'):  # Help
                self.show_annotation_instructions(image_copy, window_name)
                    
            elif key == ord('q') or key == ord('Q') or key == 27:  # Quit (Q or ESC)
                print("[EXIT] Annotation cancelled")
                cv2.destroyAllWindows()
                return False
        
        return True
    
    def set_target_distances(self):
        """Set target distances for quality control"""
        if len(self.keypoints) < 2:
            print("[ERR] Need at least 2 keypoints to set distances")
            return
        
        print("\n" + "="*60)
        print("SET TARGET DISTANCES")
        print("="*60)
        print("Enter target distance (in cm) for each measurement pair.")
        print("These will be used for quality control checks.")
        print("Press Enter to skip a pair.\n")
        
        for i in range(0, len(self.keypoints)-1, 2):
            if i+1 < len(self.keypoints):
                pair_num = i//2 + 1
                try:
                    distance_str = input(f"Target distance for Pair {pair_num} (points {i+1}-{i+2}) in cm: ").strip()
                    if distance_str:
                        distance = float(distance_str)
                        self.target_distances[pair_num] = distance
                        print(f"[OK] Set target for Pair {pair_num}: {distance} cm")
                except ValueError:
                    print(f"[SKIP] Invalid input for Pair {pair_num}. Skipping...")
        
        print(f"\n[OK] Set {len(self.target_distances)} target distances")
    
    def annotate_placement_box(self):
        """Annotate a placement guide box for garment positioning"""
        if self.image is None:
            print("[ERR] No image loaded!")
            return False
        
        print("\n" + "="*60)
        print("PLACEMENT GUIDE BOX ANNOTATION")
        print("="*60)
        print("Draw a rectangle around the area where the garment should be placed.")
        
        # Reset zoom and pan
        self.zoom_factor = 1.0
        self.zoom_center = None
        self.pan_x = 0
        self.pan_y = 0
        
        image_copy = self.image.copy()
        drawing = False
        temp_box = []
        
        def redraw_box(img, box_coords, final=False):
            """Redraw the placement box on image"""
            img[:] = self.image.copy()
            
            if len(box_coords) >= 2:
                x1, y1 = box_coords[0]
                x2, y2 = box_coords[1] if len(box_coords) > 1 else box_coords[0]
                
                if final:
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 255), 4)
                    text = "PLACEMENT GUIDE"
                    text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)[0]
                    text_x = (x1 + x2 - text_size[0]) // 2
                    text_y = (y1 + y2 + text_size[1]) // 2
                    cv2.putText(img, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 5)
                    cv2.putText(img, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                else:
                    cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
        
        def box_mouse_callback(event, x, y, flags, param):
            nonlocal image_copy, drawing, temp_box
            
            if event == cv2.EVENT_LBUTTONDOWN:
                drawing = True
                temp_box = [[x, y]]
                print(f"[BOX] Started at ({x}, {y})")
                
            elif event == cv2.EVENT_MOUSEMOVE:
                if drawing and len(temp_box) == 1:
                    temp_box_display = [temp_box[0], [x, y]]
                    redraw_box(image_copy, temp_box_display)
                    
            elif event == cv2.EVENT_LBUTTONUP:
                if drawing and len(temp_box) == 1:
                    drawing = False
                    temp_box.append([x, y])
                    self.placement_box = [temp_box[0][0], temp_box[0][1], x, y]
                    print(f"[BOX] Completed: ({self.placement_box[0]}, {self.placement_box[1]}) to ({self.placement_box[2]}, {self.placement_box[3]})")
                    redraw_box(image_copy, temp_box, final=True)
        
        window_name = "Placement Guide - Draw box for garment positioning"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 1200, 800)
        cv2.setMouseCallback(window_name, box_mouse_callback)
        
        print("\nDraw a rectangle by clicking and dragging.")
        print("Press 'S' to save, 'C' to clear, 'Q' to quit")
        
        while True:
            cv2.imshow(window_name, image_copy)
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('s') or key == ord('S'):
                if len(self.placement_box) == 4:
                    x1, y1, x2, y2 = self.placement_box
                    self.placement_box = [
                        min(x1, x2), min(y1, y2),
                        max(x1, x2), max(y1, y2)
                    ]
                    print(f"[OK] Placement guide box saved!")
                    break
                else:
                    print("[ERR] Please draw a box first!")
                    
            elif key == ord('c') or key == ord('C'):
                self.placement_box = []
                temp_box = []
                drawing = False
                image_copy[:] = self.image.copy()
                print("[BOX] Box cleared")
                    
            elif key == ord('q') or key == ord('Q') or key == 27:
                print("[EXIT] Placement guide annotation cancelled")
                self.placement_box = []
                cv2.destroyAllWindows()
                return False
        
        cv2.destroyAllWindows()
        return True
    
    def show_annotation_instructions(self, image, window_name):
        """Display annotation instructions on image"""
        instructions = [
            "ANNOTATION CONTROLS:",
            "",
            "Left Click  - Place point",
            "Right Click - Remove nearest point", 
            "Z / X       - Zoom in / out",
            "R           - Reset zoom",
            "W/A/D/E     - Pan up/left/right/down",
            "C           - Clear last point",
            "S           - Save and continue",
            "H           - Show this help",
            "Q / ESC     - Quit without saving",
            "",
            f"First {self.corner_keypoints_count} points = CORNERS (yellow)",
            "Remaining points = REGULAR (green)",
        ]
        
        temp_img = image.copy()
        
        # Draw semi-transparent background
        overlay = temp_img.copy()
        cv2.rectangle(overlay, (5, 5), (400, 380), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, temp_img, 0.3, 0, temp_img)
        
        for i, instruction in enumerate(instructions):
            cv2.putText(temp_img, instruction, (15, 35 + i*25), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        
        cv2.imshow(window_name, temp_img)
        cv2.waitKey(3000)


def list_available_images():
    """List available article images from storage"""
    images_dir = STORAGE_PATH / "article-images"
    
    if not images_dir.exists():
        print(f"[WARN] Article images directory not found: {images_dir}")
        return []
    
    images = []
    for article_dir in images_dir.iterdir():
        if article_dir.is_dir():
            for img_file in article_dir.glob("*.jpg"):
                images.append({
                    'path': str(img_file),
                    'article_id': article_dir.name,
                    'filename': img_file.name
                })
            for img_file in article_dir.glob("*.jpeg"):
                images.append({
                    'path': str(img_file),
                    'article_id': article_dir.name,
                    'filename': img_file.name
                })
            for img_file in article_dir.glob("*.png"):
                images.append({
                    'path': str(img_file),
                    'article_id': article_dir.name,
                    'filename': img_file.name
                })
    
    return images


def list_existing_annotations():
    """List existing annotations"""
    annotations_dir = STORAGE_PATH / "annotations"
    
    if not annotations_dir.exists():
        return []
    
    annotations = []
    for style_dir in annotations_dir.iterdir():
        if style_dir.is_dir():
            for json_file in style_dir.glob("*.json"):
                annotations.append({
                    'path': str(json_file),
                    'article_style': style_dir.name,
                    'filename': json_file.name
                })
    
    return annotations


def main():
    """Main entry point for annotation tool"""
    print("=" * 60)
    print("MagicQC IMAGE ANNOTATION TOOL")
    print("=" * 60)
    print(f"Storage Path: {STORAGE_PATH}")
    print("")
    
    annotator = ImageAnnotator()
    
    while True:
        print("\nOptions:")
        print("1. Annotate new image")
        print("2. Load and edit existing annotation")
        print("3. List available images")
        print("4. List existing annotations")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == '1':
            # Annotate new image
            print("\n--- ANNOTATE NEW IMAGE ---")
            
            # Get image path
            image_path = input("Enter image path (or drag & drop): ").strip().strip('"').strip("'")
            
            if not image_path or not os.path.exists(image_path):
                print("[ERR] Invalid image path!")
                continue
            
            # Get article style
            article_style = input("Enter Article Style (e.g., NKE-TS-001): ").strip().upper()
            if not article_style:
                print("[ERR] Article style is required!")
                continue
            
            # Get size
            size = input("Enter Size (e.g., S, M, L, XL): ").strip().upper()
            if not size:
                print("[ERR] Size is required!")
                continue
            
            # Load image and annotate
            if annotator.load_image(image_path):
                annotator.set_article_info(article_style, size)
                
                # Check for existing annotation
                if annotator.load_annotation(article_style, size):
                    edit = input(f"\nExisting annotation found for {article_style}-{size}. Edit it? (y/n): ").strip().lower()
                    if edit != 'y' and edit != 'yes':
                        annotator.clear_annotation()
                
                annotator.annotate_measurement_points()
        
        elif choice == '2':
            # Load and edit existing annotation
            print("\n--- EDIT EXISTING ANNOTATION ---")
            
            annotations = list_existing_annotations()
            if not annotations:
                print("[INFO] No existing annotations found.")
                continue
            
            print("\nExisting Annotations:")
            for i, ann in enumerate(annotations, 1):
                print(f"  {i}. {ann['article_style']} - {ann['filename']}")
            
            try:
                idx = int(input("\nSelect annotation number: ").strip()) - 1
                if 0 <= idx < len(annotations):
                    ann = annotations[idx]
                    
                    # Extract article style and size from filename
                    filename = ann['filename'].replace('.json', '')
                    parts = filename.rsplit('_', 1)
                    if len(parts) == 2:
                        article_style = parts[0]
                        size = parts[1]
                    else:
                        article_style = ann['article_style']
                        size = input("Enter Size: ").strip().upper()
                    
                    if annotator.load_annotation(article_style, size):
                        annotator.annotate_measurement_points()
                else:
                    print("[ERR] Invalid selection!")
            except ValueError:
                print("[ERR] Invalid input!")
        
        elif choice == '3':
            # List available images
            print("\n--- AVAILABLE IMAGES ---")
            images = list_available_images()
            if images:
                for img in images:
                    print(f"  Article {img['article_id']}: {img['filename']}")
                print(f"\nTotal: {len(images)} images")
            else:
                print("[INFO] No images found in storage.")
        
        elif choice == '4':
            # List existing annotations
            print("\n--- EXISTING ANNOTATIONS ---")
            annotations = list_existing_annotations()
            if annotations:
                for ann in annotations:
                    print(f"  {ann['article_style']}: {ann['filename']}")
                print(f"\nTotal: {len(annotations)} annotations")
            else:
                print("[INFO] No annotations found.")
        
        elif choice == '5':
            print("\nGoodbye!")
            break
        
        else:
            print("[ERR] Invalid choice!")


# Command line interface
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) >= 4:
        # Command line mode: python image_annotator.py <image_path> <article_style> <size>
        image_path = sys.argv[1]
        article_style = sys.argv[2].upper()
        size = sys.argv[3].upper()
        
        annotator = ImageAnnotator()
        if annotator.load_image(image_path):
            annotator.set_article_info(article_style, size)
            annotator.annotate_measurement_points()
    else:
        # Interactive mode
        main()
