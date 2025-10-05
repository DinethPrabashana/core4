import os
import uuid
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import the core logic from your anomaly_cv.py
from anomaly_cv import detect_anomalies, BlobDet

# --- Flask App Setup ---

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for your frontend

# Create a temporary directory for file processing if it doesn't exist
TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

def image_to_data_uri(filepath):
    """Convert an image file to a base64 data URI."""
    with open(filepath, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return f"data:image/png;base64,{encoded_string}"

@app.route('/analyze', methods=['POST'])
def analyze_images_endpoint():
    """
    Flask endpoint to receive images, run anomaly detection, and return results.
    """
    if 'baseline' not in request.files or 'maintenance' not in request.files:
        return jsonify({"error": "Missing baseline or maintenance image"}), 400

    baseline_file = request.files['baseline']
    maintenance_file = request.files['maintenance']
    
    # The frontend doesn't use the threshold with this advanced CV script,
    # but we can keep the parameter for future use.
    # Legacy threshold (unused now) and new slider_percent (0-100)
    threshold = request.form.get('threshold', 0.5)  # kept for backward compatibility
    slider_percent = request.form.get('slider_percent')
    try:
        slider_percent_val = float(slider_percent) if slider_percent not in (None, "") else None
    except ValueError:
        slider_percent_val = None
    inspection_id = request.form.get('inspection_id', 'unknown_inspection')

    # --- File Handling ---
    # Create unique filenames to avoid conflicts
    run_id = str(uuid.uuid4())
    baseline_path = os.path.join(TEMP_DIR, f"{run_id}_baseline.png")
    maintenance_path = os.path.join(TEMP_DIR, f"{run_id}_maintenance.png")
    overlay_path = os.path.join(TEMP_DIR, f"{run_id}_overlay.png")
    report_path = os.path.join(TEMP_DIR, f"{run_id}_report.json")

    # Save uploaded files to the temporary directory
    baseline_file.save(baseline_path)
    maintenance_file.save(maintenance_path)

    try:
        # --- Run Core CV Logic ---
        # Call the function from your anomaly_cv.py script
        report = detect_anomalies(
            transformer_id=inspection_id,
            baseline_path=baseline_path,
            maintenance_path=maintenance_path,
            out_overlay_path=overlay_path,
            out_json_path=report_path,
            slider_percent=slider_percent_val
        )

        # --- Prepare Response for Frontend ---
        # The frontend expects a specific format. We'll adapt the report.
        
        # 1. Convert the generated overlay image to a data URI
        annotated_image_uri = image_to_data_uri(overlay_path)

        # 2. Format the blob detections into the 'anomalies' list format
        anomalies_list = []
        for i, blob in enumerate(report.blobs):
            x, y, w, h = blob.bbox
            anomalies_list.append({
                "id": f"ai_{i + 1}",
                "x": x,
                "y": y,
                "w": w,
                "h": h,
                "confidence": blob.confidence,
                "severity": blob.classification, # Maps to 'Faulty', 'Potentially Faulty'
                "classification": blob.subtype, # Maps to 'LooseJoint', 'PointOverload', etc.
                "comment": "",
                "source": "ai"
            })

        # Parse thresholds_used from JSON file (already written). Instead of re-reading the file,
        # we can construct it from the report object attributes.
        thresholds_used = {
            "t_pot": report.t_pot,
            "t_fault": report.t_fault,
            "base_t_pot": report.base_t_pot,
            "base_t_fault": report.base_t_fault,
            "slider_percent": report.slider_percent,
            "scale_applied": report.scale_applied,
            "source": report.threshold_source,
            "ratio": report.ratio,
            "mean_ssim": report.mean_ssim
        }

        return jsonify({
            "annotatedImage": annotated_image_uri,
            "anomalies": anomalies_list,
            "thresholdsUsed": thresholds_used
        })

    except Exception as e:
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500

    finally:
        # --- Cleanup ---
        # Clean up the temporary files after the request is complete
        for path in [baseline_path, maintenance_path, overlay_path, report_path]:
            if os.path.exists(path):
                os.remove(path)

if __name__ == '__main__':
    # This makes the server accessible on your local network
    app.run(host='0.0.0.0', port=8000, debug=True)