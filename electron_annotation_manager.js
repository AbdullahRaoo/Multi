/**
 * MagicQC Electron App - Annotation Manager
 * 
 * This module handles:
 * 1. Fetching annotations from VPS MySQL database
 * 2. Writing annotation files for Python measurement system
 * 3. Managing reference images
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

class AnnotationManager {
  constructor(config) {
    this.dbConfig = {
      host: config.host || 'localhost',
      user: config.user || 'root',
      password: config.password,
      database: config.database || 'magicqc'
    };
    this.connection = null;
    this.workingDirectory = config.workingDirectory || path.join(__dirname, 'measurement_data');
  }

  /**
   * Connect to VPS MySQL database
   */
  async connect() {
    try {
      this.connection = await mysql.createConnection(this.dbConfig);
      console.log('✓ Connected to MySQL database');
      return true;
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('✓ Disconnected from database');
    }
  }

  /**
   * Get list of all available annotations
   * 
   * @returns {Array} List of annotations with basic info
   */
  async listAnnotations() {
    const [rows] = await this.connection.query(`
      SELECT 
        id,
        article_style,
        size,
        name,
        image_width,
        image_height,
        JSON_LENGTH(keypoints_pixels) as keypoint_count,
        JSON_LENGTH(target_distances) as target_distance_count,
        created_at,
        updated_at
      FROM article_annotations
      ORDER BY article_style, size
    `);
    
    return rows;
  }

  /**   * Get active camera calibration.
   * 
   * @returns {Object|null} Active calibration or null
   */
  async getActiveCalibration() {
    const [rows] = await this.connection.query(`
      SELECT 
        id,
        name,
        pixels_per_cm,
        reference_length_cm,
        pixel_distance,
        is_active,
        created_at,
        updated_at
      FROM camera_calibrations
      WHERE is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    return rows[0] || null;
  }

  /**
   * Write calibration file for Python measurement system.
   * 
   * Format: {
   *   pixels_per_cm: float,
   *   reference_length_cm: float,
   *   is_calibrated: true,
   *   calibration_date: "ISO8601"
   * }
   * 
   * @param {Object} calibration - Calibration data from database
   * @param {string} outputPath - Directory to write file
   * @returns {string} Path to written file
   */
  async writeCalibrationFile(calibration, outputPath) {
    try {
      if (!calibration) {
        throw new Error('No calibration data provided');
      }

      // Create calibration data in Python measurement system format
      const calibrationData = {
        pixels_per_cm: parseFloat(calibration.pixels_per_cm),
        reference_length_cm: parseFloat(calibration.reference_length_cm),
        is_calibrated: true,
        calibration_date: calibration.updated_at || new Date().toISOString()
      };

      // Write to camera_calibration.json
      const calibrationFilePath = path.join(outputPath, 'camera_calibration.json');
      await fs.writeFile(
        calibrationFilePath,
        JSON.stringify(calibrationData, null, 4),
        'utf8'
      );

      console.log(`✓ Calibration file written: ${calibrationFilePath}`);
      console.log(`  Pixels per cm: ${calibrationData.pixels_per_cm}`);
      console.log(`  Reference length: ${calibrationData.reference_length_cm} cm`);

      return calibrationFilePath;
    } catch (error) {
      console.error('✗ Error writing calibration file:', error.message);
      throw error;
    }
  }

  /**   * Get specific annotation by article style and size
   * 
   * @param {string} articleStyle - Article style code (e.g., 'NKE-TS-001')
   * @param {string} size - Size (e.g., 'XXL', 'L')
   * @returns {Object|null} Annotation data or null if not found
   */
  async getAnnotation(articleStyle, size) {
    const [rows] = await this.connection.query(`
      SELECT 
        id,
        article_style,
        size,
        name,
        keypoints_pixels,
        target_distances,
        placement_box,
        image_width,
        image_height,
        image_data,
        image_mime_type,
        created_at,
        updated_at
      FROM article_annotations
      WHERE article_style = ? AND size = ?
      LIMIT 1
    `, [articleStyle, size]);
    
    return rows[0] || null;
  }

  /**
   * Write annotation file for Python measurement system
   * 
   * Format: {
   *   keypoints: [[x,y], [x,y], ...],
   *   target_distances: {1: value, 2: value, ...},
   *   placement_box: [x1, y1, x2, y2],
   *   annotation_date: "ISO8601"
   * }
   * 
   * @param {Object} annotation - Annotation data from database
   * @param {string} outputPath - Directory to write file
   * @returns {string} Path to written file
   */
  async writeAnnotationFile(annotation, outputPath) {
    try {
      // Parse JSON columns
      const keypoints = JSON.parse(annotation.keypoints_pixels || '[]');
      const targetDistances = JSON.parse(annotation.target_distances || '{}');
      const placementBox = JSON.parse(annotation.placement_box || '[]');
      
      // CRITICAL: Convert target_distances to have INTEGER keys
      // Python expects: {1: value, 2: value, ...}
      // NOT: {"1": value, "2": value, ...}
      const targetDistancesFormatted = {};
      for (const [key, value] of Object.entries(targetDistances)) {
        targetDistancesFormatted[parseInt(key)] = parseFloat(value);
      }
      
      // Create annotation data in EXACT format Python measurement system expects
      const annotationData = {
        keypoints: keypoints,                          // [[x,y], [x,y], ...]
        target_distances: targetDistancesFormatted,    // {1: value, 2: value}
        placement_box: placementBox,                   // [x1, y1, x2, y2] or []
        annotation_date: annotation.updated_at || new Date().toISOString()
      };
      
      // Validate format
      if (!Array.isArray(keypoints) || keypoints.length === 0) {
        throw new Error('Invalid keypoints format: must be non-empty array');
      }
      
      if (!keypoints.every(p => Array.isArray(p) && p.length === 2)) {
        throw new Error('Invalid keypoints format: each keypoint must be [x, y]');
      }
      
      // Write to annotation_data.json
      const annotationFilePath = path.join(outputPath, 'annotation_data.json');
      await fs.writeFile(
        annotationFilePath,
        JSON.stringify(annotationData, null, 4),
        'utf8'
      );
      
      console.log(`✓ Annotation file written: ${annotationFilePath}`);
      console.log(`  Keypoints: ${keypoints.length}`);
      console.log(`  Target distances: ${Object.keys(targetDistancesFormatted).length}`);
      console.log(`  Placement box: ${placementBox.length > 0 ? 'Yes' : 'No'}`);
      
      return annotationFilePath;
    } catch (error) {
      console.error('✗ Error writing annotation file:', error.message);
      throw error;
    }
  }

  /**
   * Write reference image from Base64 data
   * 
   * @param {Object} annotation - Annotation data with image_data
   * @param {string} outputPath - Directory to write image
   * @returns {string} Path to written image
   */
  async writeReferenceImage(annotation, outputPath) {
    try {
      if (!annotation.image_data) {
        throw new Error('No image data available');
      }
      
      // Decode Base64 image data
      const imageBuffer = Buffer.from(annotation.image_data, 'base64');
      
      // Determine file extension from MIME type
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
      };
      const extension = mimeToExt[annotation.image_mime_type] || '.jpg';
      
      // Write reference image
      const imageFilePath = path.join(outputPath, `reference_image${extension}`);
      await fs.writeFile(imageFilePath, imageBuffer);
      
      console.log(`✓ Reference image written: ${imageFilePath}`);
      console.log(`  Dimensions: ${annotation.image_width}x${annotation.image_height}`);
      console.log(`  Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      
      return imageFilePath;
    } catch (error) {
      console.error('✗ Error writing reference image:', error.message);
      throw error;
    }
  }

  /**
   * Setup measurement environment for specific article
   * 
   * This is the main function that:
   * 1. Fetches annotation from database
   * 2. Creates output directory
   * 3. Writes annotation JSON file
   * 4. Writes reference image
   * 
   * @param {string} articleStyle - Article style code
   * @param {string} size - Size
   * @returns {Object} Setup result with paths
   */
  async setupMeasurement(articleStyle, size) {
    try {
      console.log('\n' + '='.repeat(60));
      console.log(`Setting up measurement for: ${articleStyle} - ${size}`);
      console.log('='.repeat(60));
      
      // Ensure connected
      if (!this.connection) {
        await this.connect();
      }
      
      // 1. Fetch calibration from database
      console.log('\n[1/5] Fetching camera calibration...');
      const calibration = await this.getActiveCalibration();
      
      if (!calibration) {
        throw new Error('No active calibration found! Please calibrate the camera first.');
      }
      
      console.log(`✓ Found: ${calibration.name}`);
      console.log(`  Pixels per cm: ${calibration.pixels_per_cm}`);
      console.log(`  Reference length: ${calibration.reference_length_cm} cm`);
      
      // 2. Fetch annotation from database
      console.log('\n[2/5] Fetching annotation from database...');
      const annotation = await this.getAnnotation(articleStyle, size);
      
      if (!annotation) {
        throw new Error(`No annotation found for ${articleStyle} - ${size}`);
      }
      
      console.log(`✓ Found: ${annotation.name}`);
      
      // 3. Create output directory
      console.log('\n[3/5] Creating output directory...');
      const outputPath = path.join(
        this.workingDirectory,
        articleStyle,
        size
      );
      await fs.mkdir(outputPath, { recursive: true });
      console.log(`✓ Directory: ${outputPath}`);
      
      // 4. Write calibration file
      console.log('\n[4/5] Writing calibration file...');
      const calibrationFile = await this.writeCalibrationFile(calibration, outputPath);
      
      // 5. Write annotation JSON file
      console.log('\n[5/5] Writing annotation file...');
      const annotationFile = await this.writeAnnotationFile(annotation, outputPath);
      
      // 6. Write reference image
      console.log('\n[6/6] Writing reference image...');
      const imageFile = await this.writeReferenceImage(annotation, outputPath);
      
      console.log('\n' + '='.repeat(60));
      console.log('✓ Setup complete! Ready for Python measurement system.');
      console.log('='.repeat(60));
      console.log(`Working directory: ${outputPath}`);
      console.log('Files created:');
      console.log('  - camera_calibration.json');
      console.log('  - annotation_data.json');
      console.log('  - reference_image.jpg');
      console.log('\nYou can now run: python measurment2.py');
      console.log('='.repeat(60));
      
      return {
        success: true,
        outputPath,
        calibrationFile,
        annotationFile,
        imageFile,
        calibration: {
          name: calibration.name,
          pixelsPerCm: calibration.pixels_per_cm,
          referenceLengthCm: calibration.reference_length_cm
        },
        annotation: {
          style: annotation.article_style,
          size: annotation.size,
          name: annotation.name,
          keypointCount: JSON.parse(annotation.keypoints_pixels).length,
          imageDimensions: `${annotation.image_width}x${annotation.image_height}`
        }
      };
      
    } catch (error) {
      console.error('\n✗ Setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Update target distances after measurement
   * 
   * After the first measurement, the Python system sets target_distances.
   * This function updates the database with those values.
   * 
   * @param {string} articleStyle - Article style code
   * @param {string} size - Size
   * @param {Object} targetDistances - Target distances {1: value, 2: value, ...}
   */
  async updateTargetDistances(articleStyle, size, targetDistances) {
    try {
      // Ensure connected
      if (!this.connection) {
        await this.connect();
      }
      
      // Convert to JSON string
      const targetDistancesJson = JSON.stringify(targetDistances);
      
      // Update database
      await this.connection.query(`
        UPDATE article_annotations
        SET target_distances = ?
        WHERE article_style = ? AND size = ?
      `, [targetDistancesJson, articleStyle, size]);
      
      console.log(`✓ Updated target distances for ${articleStyle} - ${size}`);
      console.log(`  Measurements: ${Object.keys(targetDistances).length}`);
      
      return true;
    } catch (error) {
      console.error('✗ Error updating target distances:', error.message);
      throw error;
    }
  }

  /**
   * Get measurement results from Python system
   * 
   * @param {string} outputPath - Directory containing measurement results
   * @returns {Object|null} Measurement results or null
   */
  async getMeasurementResults(outputPath) {
    try {
      const resultsFile = path.join(outputPath, 'measurement_results', 'live_measurements.json');
      const data = await fs.readFile(resultsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist yet
      }
      throw error;
    }
  }
}

// Export the class
module.exports = AnnotationManager;

// Example usage if run directly
if (require.main === module) {
  (async () => {
    const manager = new AnnotationManager({
      host: 'localhost',     // Change to your VPS IP
      user: 'root',
      password: '',          // Your MySQL password
      database: 'magicqc',
      workingDirectory: path.join(__dirname, 'measurement_data')
    });
    
    try {
      // Connect to database
      await manager.connect();
      
      // List all available annotations
      console.log('\nAvailable annotations:');
      const annotations = await manager.listAnnotations();
      annotations.forEach(ann => {
        console.log(`  ${ann.article_style} - ${ann.size}: ${ann.keypoint_count} keypoints`);
      });
      
      // Setup measurement for specific article
      // Example: NKE-TS-001 in size XXL
      const result = await manager.setupMeasurement('NKE-TS-001', 'XXL');
      
      console.log('\nSetup result:', result);
      
      // Disconnect
      await manager.disconnect();
      
    } catch (error) {
      console.error('Error:', error);
      await manager.disconnect();
      process.exit(1);
    }
  })();
}
