# Camera Calibration Integration Guide

## Overview

The camera calibration process has been extracted from the Python measurement system and integrated into the Laravel dashboard. This allows operators to calibrate the camera **before** creating annotations, ensuring accurate pixel-to-cm conversions.

---

## Database Structure

### Table: `camera_calibrations`

```sql
CREATE TABLE `camera_calibrations` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),                  -- Calibration name (e.g., "Camera 1 - 2026-02-02")
  `pixels_per_cm` float(10,4),          -- Scale factor: pixels per centimeter
  `reference_length_cm` float(10,2),    -- Known reference length in cm
  `pixel_distance` int,                 -- Measured pixel distance
  `calibration_image` text,             -- Base64 calibration image (optional)
  `calibration_points` json,            -- [[x1,y1], [x2,y2]] two points used
  `is_active` boolean DEFAULT true,     -- Active calibration flag
  `created_at` timestamp,
  `updated_at` timestamp
);
```

---

## Calibration Workflow

### Step 1: Place Reference Object

**Operator Action:**
1. Place an object of **known size** in front of the camera
2. Examples: Ruler (30cm), A4 paper (29.7cm width), calibration card

**Requirements:**
- Object must have a **clearly marked distance** (e.g., ruler markings)
- Object should be flat and perpendicular to camera
- Good lighting for clear visibility

### Step 2: Capture Reference Image

**Frontend Action:**
```javascript
// Capture frame from webcam
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
const imageDataUrl = canvas.toDataURL('image/jpeg');
```

### Step 3: Mark Two Points

**Operator Action:**
1. Click on the **start** of the known distance (e.g., 0cm mark on ruler)
2. Click on the **end** of the known distance (e.g., 30cm mark on ruler)

**Frontend Captures:**
```javascript
const calibrationPoints = [
  [x1, y1],  // First point (start of known distance)
  [x2, y2]   // Second point (end of known distance)
];
```

### Step 4: Enter Known Distance

**Operator Input:**
- Enter the **real-world distance** between the two points in centimeters
- Example: If you marked 0cm to 30cm on a ruler, enter `30`

### Step 5: Calculate and Save

**Backend Calculation:**
```php
// Calculate pixel distance
$pixelDistance = sqrt(
    pow($point2[0] - $point1[0], 2) + 
    pow($point2[1] - $point1[1], 2)
);

// Calculate pixels per cm
$pixelsPerCm = $pixelDistance / $referenceLengthCm;

// Save calibration
CameraCalibration::create([
    'name' => 'Calibration ' . date('Y-m-d H:i:s'),
    'pixels_per_cm' => $pixelsPerCm,
    'reference_length_cm' => $referenceLengthCm,
    'pixel_distance' => (int) round($pixelDistance),
    'calibration_points' => $calibrationPoints,
    'is_active' => true
]);
```

---

## API Endpoints

### 1. Get Active Calibration

```http
GET /article-registration/calibration
```

**Response:**
```json
{
  "success": true,
  "calibration": {
    "id": 1,
    "name": "Calibration 2026-02-02 14:30:00",
    "pixels_per_cm": 64.25,
    "reference_length_cm": 30.0,
    "pixel_distance": 1928,
    "is_active": true,
    "created_at": "2026-02-02T14:30:00+00:00"
  }
}
```

### 2. Save New Calibration

```http
POST /article-registration/calibration
Content-Type: application/json

{
  "name": "Camera 1 Calibration",
  "calibration_points": [[100, 200], [1928, 220]],
  "reference_length_cm": 30.0,
  "calibration_image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Calibration saved successfully.",
  "calibration": {
    "id": 1,
    "name": "Camera 1 Calibration",
    "pixels_per_cm": 64.25,
    "reference_length_cm": 30.0,
    "pixel_distance": 1928
  }
}
```

### 3. Get All Calibrations

```http
GET /article-registration/calibrations
```

**Response:**
```json
{
  "success": true,
  "calibrations": [
    {
      "id": 1,
      "name": "Camera 1 Calibration",
      "pixels_per_cm": 64.25,
      "reference_length_cm": 30.0,
      "is_active": true
    },
    {
      "id": 2,
      "name": "Camera 2 Calibration",
      "pixels_per_cm": 62.80,
      "reference_length_cm": 30.0,
      "is_active": false
    }
  ]
}
```

### 4. Set Active Calibration

```http
POST /article-registration/calibrations/{calibrationId}/activate
```

### 5. Delete Calibration

```http
DELETE /article-registration/calibrations/{calibrationId}
```

---

## Frontend Integration

### Calibration Component (React)

```jsx
import React, { useState, useRef } from 'react';

function CalibrationTool() {
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [referenceLengthCm, setReferenceLengthCm] = useState(30);
  const canvasRef = useRef(null);

  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (calibrationPoints.length < 2) {
      setCalibrationPoints([...calibrationPoints, [x, y]]);
    }
  };

  const handleSaveCalibration = async () => {
    if (calibrationPoints.length !== 2) {
      alert('Please mark exactly 2 points');
      return;
    }

    const response = await fetch('/article-registration/calibration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calibration_points: calibrationPoints,
        reference_length_cm: referenceLengthCm,
        name: `Calibration ${new Date().toLocaleString()}`
      })
    });

    const data = await response.json();
    if (data.success) {
      alert(`Calibration saved! Scale: ${data.calibration.pixels_per_cm.toFixed(2)} pixels/cm`);
    }
  };

  return (
    <div>
      <h2>Camera Calibration</h2>
      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ border: '1px solid black', cursor: 'crosshair' }}
      />
      
      <div>
        <label>Reference Length (cm):</label>
        <input 
          type="number" 
          value={referenceLengthCm}
          onChange={(e) => setReferenceLengthCm(parseFloat(e.target.value))}
        />
      </div>

      <button onClick={handleSaveCalibration}>
        Save Calibration
      </button>
      
      <p>Points marked: {calibrationPoints.length}/2</p>
    </div>
  );
}
```

---

## Usage in Annotation Process

### Before (No Calibration)

```javascript
// Annotations saved without scale factor
saveAnnotation({
  annotations: [[50%, 30%], [60%, 40%], ...],
  // No way to convert to cm!
});
```

### After (With Calibration)

```javascript
// 1. Check if calibration exists
const calibrationResponse = await fetch('/article-registration/calibration');
const { calibration } = await calibrationResponse.json();

if (!calibration) {
  alert('Please calibrate the camera first!');
  return;
}

// 2. Save annotations with calibration reference
saveAnnotation({
  annotations: [[50%, 30%], [60%, 40%], ...],
  // Calibration data is stored separately and can be used
  // when Electron app fetches annotations for measurements
});

// 3. When measuring, convert pixels to cm using calibration
const pixelDistance = calculatePixelDistance(point1, point2);
const realDistanceCm = pixelDistance / calibration.pixels_per_cm;
```

---

## Python System Integration

### Export Calibration for Python

```php
// In Electron app or export script
$calibration = CameraCalibration::getActive();

// Write camera_calibration.json
file_put_contents('camera_calibration.json', json_encode([
    'pixels_per_cm' => $calibration->pixels_per_cm,
    'reference_length_cm' => $calibration->reference_length_cm,
    'is_calibrated' => true,
    'calibration_date' => $calibration->updated_at->toIso8601String()
], JSON_PRETTY_PRINT));
```

**Output: `camera_calibration.json`**
```json
{
    "pixels_per_cm": 64.25,
    "reference_length_cm": 30.0,
    "is_calibrated": true,
    "calibration_date": "2026-02-02T14:30:00+00:00"
}
```

**Python loads it:**
```python
def load_calibration(self):
    with open('camera_calibration.json', 'r') as f:
        calibration_data = json.load(f)
    
    self.pixels_per_cm = calibration_data.get('pixels_per_cm', 0)
    self.reference_length_cm = calibration_data.get('reference_length_cm', 0)
    self.is_calibrated = calibration_data.get('is_calibrated', False)
```

---

## Best Practices

### 1. Calibrate Once Per Camera

- Each camera/computer should have its own calibration
- Calibration is stored in database and shared across all annotations
- No need to recalibrate for each annotation

### 2. Recalibrate When:

- Camera is moved or repositioned
- Different zoom level is used
- Camera settings are changed
- Measurements seem inaccurate

### 3. Verify Calibration

```javascript
// Test calibration with known distance
const testPoint1 = [100, 100];
const testPoint2 = [164.25, 100]; // 1cm apart if pixels_per_cm = 64.25

const pixelDist = Math.sqrt(
  Math.pow(testPoint2[0] - testPoint1[0], 2) + 
  Math.pow(testPoint2[1] - testPoint1[1], 2)
);
// pixelDist should be ~64.25

const realDist = pixelDist / calibration.pixels_per_cm;
// realDist should be ~1.0 cm
```

### 4. Multiple Calibrations

- Keep multiple calibrations for different cameras
- Mark them with meaningful names: "Camera 1", "Camera 2", etc.
- Switch active calibration when using different camera

---

## Error Handling

### No Calibration Found

```javascript
const response = await fetch('/article-registration/calibration');
const { calibration } = await response.json();

if (!calibration) {
  // Show calibration wizard
  showCalibrationWizard();
  return;
}
```

### Invalid Calibration Points

```php
// Backend validation
if (count($calibrationPoints) !== 2) {
    return response()->json([
        'success' => false,
        'message' => 'Exactly 2 calibration points required'
    ], 422);
}

if ($referenceLengthCm <= 0) {
    return response()->json([
        'success' => false,
        'message' => 'Reference length must be greater than 0'
    ], 422);
}
```

### Calibration Too Old

```javascript
// Check if calibration is recent
const calibrationAge = new Date() - new Date(calibration.updated_at);
const daysSinceCalibration = calibrationAge / (1000 * 60 * 60 * 24);

if (daysSinceCalibration > 30) {
  alert('Calibration is more than 30 days old. Consider recalibrating.');
}
```

---

## Testing

### Manual Test

1. **Create calibration:**
   ```bash
   curl -X POST http://localhost:8000/article-registration/calibration \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Calibration",
       "calibration_points": [[100, 200], [1928, 220]],
       "reference_length_cm": 30.0
     }'
   ```

2. **Verify calibration:**
   ```bash
   curl http://localhost:8000/article-registration/calibration
   ```

3. **Expected result:**
   - `pixels_per_cm` ≈ 64.25
   - `pixel_distance` ≈ 1928
   - `is_active` = true

### Automated Test

```php
public function test_calibration_calculation()
{
    $point1 = [100, 200];
    $point2 = [1928, 220];
    $referenceLengthCm = 30.0;
    
    $pixelsPerCm = CameraCalibration::calculatePixelsPerCm(
        $point1, $point2, $referenceLengthCm
    );
    
    $this->assertEqualsWithDelta(64.25, $pixelsPerCm, 0.1);
}
```

---

## Summary

✅ **Calibration table created** (`camera_calibrations`)  
✅ **CameraCalibration model** with helper methods  
✅ **API endpoints** for calibration management  
✅ **Active calibration** system (only one active at a time)  
✅ **Compatible with Python** measurement system  
✅ **Export format** matches `camera_calibration.json`  

**Next Steps:**
1. Update frontend to show calibration wizard before annotation
2. Display current calibration status in UI
3. Add calibration verification tool
4. Update Electron app to export calibration files

**Calibration is now part of the annotation workflow! 🎯**
