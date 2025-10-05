import os
import uuid
import json
import base64
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# Import the core logic from your anomaly_cv.py
from anomaly_cv import detect_anomalies, BlobDet

# --- Flask App Setup ---

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for your frontend

# Create directories for file processing if they don't exist
TEMP_DIR = "temp_files"
BASELINES_DIR = "baselines"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(BASELINES_DIR, exist_ok=True)

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
    # Handle baseline: either uploaded file or stored filename
    baseline_path = None
    if 'baseline_filename' in request.form:
        filename = request.form['baseline_filename']
        baseline_path = os.path.join(BASELINES_DIR, filename)
        if not os.path.exists(baseline_path):
            return jsonify({"error": "Baseline file not found"}), 404
    elif 'baseline' in request.files:
        baseline_file = request.files['baseline']
        run_id = str(uuid.uuid4())
        baseline_path = os.path.join(TEMP_DIR, f"{run_id}_baseline.png")
        baseline_file.save(baseline_path)
    else:
        return jsonify({"error": "Missing baseline"}), 400

    if 'maintenance' not in request.files:
        return jsonify({"error": "Missing maintenance image"}), 400

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
    # Create unique filenames for maintenance and output
    run_id = str(uuid.uuid4())
    maintenance_path = os.path.join(TEMP_DIR, f"{run_id}_maintenance.png")
    overlay_path = os.path.join(TEMP_DIR, f"{run_id}_overlay.png")
    report_path = os.path.join(TEMP_DIR, f"{run_id}_report.json")

    # Save maintenance file
    maintenance_file.save(maintenance_path)

    # Debug logging
    print(f"Using baseline: {baseline_path}, size: {os.path.getsize(baseline_path) if os.path.exists(baseline_path) else 'N/A'}")
    print(f"Saved maintenance to {maintenance_path}, size: {os.path.getsize(maintenance_path) if os.path.exists(maintenance_path) else 'N/A'}")

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
        for path in [maintenance_path, overlay_path, report_path]:
            if os.path.exists(path):
                os.remove(path)

@app.route('/save_annotations', methods=['POST'])
def save_annotations():
    """
    Save annotations for an inspection.
    Expects JSON: { inspectionId: str, anomalies: [...] }
    """
    data = request.get_json()
    if not data or 'inspectionId' not in data or 'anomalies' not in data:
        return jsonify({"error": "Invalid payload"}), 400

    inspection_id = data['inspectionId']
    anomalies = data['anomalies']

    # For now, just log or save to a file (since no DB)
    # You can extend this to save to a JSON file or DB
    print(f"Saving annotations for inspection {inspection_id}: {len(anomalies)} anomalies")

    # Example: save to a JSON file
    import json
    with open(f"annotations_{inspection_id}.json", "w") as f:
        json.dump(data, f, indent=2)

    return jsonify({"status": "success"}), 200

@app.route('/baselines/<path:filename>', methods=['GET'])
def serve_baseline_image(filename):
    """
    Serve baseline images for download.
    """
    try:
        return send_file(os.path.join(BASELINES_DIR, filename), as_attachment=True)
    except Exception as e:
        return jsonify({"error": f"File not found: {str(e)}"}), 404

@app.route('/upload_baseline', methods=['POST'])
def upload_baseline():
    """
    Upload and store baseline image permanently.
    Returns the filename for storage in frontend.
    """
    if 'baseline' not in request.files:
        return jsonify({"error": "No baseline file"}), 400

    baseline_file = request.files['baseline']
    if baseline_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Generate unique filename
    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join(BASELINES_DIR, filename)
    baseline_file.save(filepath)

    return jsonify({"filename": filename}), 200

@app.route('/get_baseline/<filename>', methods=['GET'])
def get_baseline(filename):
    """
    Serve baseline image by filename.
    """
    filepath = os.path.join(BASELINES_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
    return send_file(filepath, mimetype='image/png')

if __name__ == '__main__':
    # This makes the server accessible on your local network
    app.run(host='0.0.0.0', port=8000, debug=True)