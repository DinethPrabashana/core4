import os
import uuid
import json
import base64
import shutil
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# Import the core logic from your anomaly_cv.py
from anomaly_cv import detect_anomalies, BlobDet

# --- Flask App Setup ---

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for your frontend

# Directories
TEMP_DIR = "temp_files"  # transient holding (may be minimal now)
BASELINES_DIR = "baselines"  # permanent baselines uploaded via /upload_baseline
INSPECTIONS_DIR = "inspections"  # persistent run history
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(BASELINES_DIR, exist_ok=True)
os.makedirs(INSPECTIONS_DIR, exist_ok=True)

def image_to_data_uri(filepath):
    """Convert an image file to a base64 data URI."""
    with open(filepath, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return f"data:image/png;base64,{encoded_string}"

@app.route('/analyze', methods=['POST'])
def analyze_images_endpoint():
    """Run anomaly detection and persist run artifacts for future phases.

    Creates structure:
      inspections/<inspection_id>/index.json
      inspections/<inspection_id>/runs/<run_id>/baseline.png
                                                 /maintenance.png
                                                 /overlay.png
                                                 /report.json
                                                 /anomalies.json
    Returns runId + assetUrls so frontend can load images without storing base64.
    """
    if 'maintenance' not in request.files:
        return jsonify({"error": "Missing maintenance image"}), 400
    maintenance_file = request.files['maintenance']

    # Baseline selection
    baseline_source_type = None
    if 'baseline_filename' in request.form:
        filename = request.form['baseline_filename']
        baseline_path = os.path.join(BASELINES_DIR, filename)
        baseline_source_type = 'stored'
        if not os.path.exists(baseline_path):
            return jsonify({"error": "Baseline file not found"}), 404
    elif 'baseline' in request.files:
        tmp_id = str(uuid.uuid4())
        baseline_file = request.files['baseline']
        baseline_path = os.path.join(TEMP_DIR, f"{tmp_id}_baseline.png")
        baseline_file.save(baseline_path)
        baseline_source_type = 'inline_upload'
    else:
        return jsonify({"error": "Missing baseline"}), 400

    slider_percent = request.form.get('slider_percent')
    try:
        slider_percent_val = float(slider_percent) if slider_percent not in (None, "") else None
    except ValueError:
        slider_percent_val = None
    inspection_id = request.form.get('inspection_id', 'unknown_inspection')

    # Prepare directories
    run_id = str(uuid.uuid4())
    inspection_root = os.path.join(INSPECTIONS_DIR, inspection_id)
    runs_root = os.path.join(inspection_root, 'runs')
    run_dir = os.path.join(runs_root, run_id)
    os.makedirs(run_dir, exist_ok=True)
    os.makedirs(runs_root, exist_ok=True)

    # Final artifact paths
    run_baseline = os.path.join(run_dir, 'baseline.png')
    run_maintenance = os.path.join(run_dir, 'maintenance.png')
    run_overlay = os.path.join(run_dir, 'overlay.png')
    run_report = os.path.join(run_dir, 'report.json')
    run_anomalies = os.path.join(run_dir, 'anomalies.json')

    # Save maintenance and copy baseline snapshot
    maintenance_file.save(run_maintenance)
    try:
        shutil.copyfile(baseline_path, run_baseline)
    except Exception as e:
        return jsonify({"error": f"Failed to copy baseline: {e}"}), 500

    # Run detection engine
    try:
        rep = detect_anomalies(
            transformer_id=inspection_id,
            baseline_path=run_baseline,
            maintenance_path=run_maintenance,
            out_overlay_path=run_overlay,
            out_json_path=run_report,
            slider_percent=slider_percent_val
        )
    except Exception as e:
        return jsonify({"error": f"Detection failed: {e}"}), 500

    # Build anomaly list for UI
    anomalies_list = []
    for i, b in enumerate(rep.blobs):
        x, y, w, h = b.bbox
        anomalies_list.append({
            "id": f"ai_{i+1}",
            "x": x, "y": y, "w": w, "h": h,
            "confidence": b.confidence,
            "severity": b.classification,
            "classification": b.subtype,
            "comment": "",
            "source": "ai"
        })

    thresholds_used = {
        "t_pot": rep.t_pot,
        "t_fault": rep.t_fault,
        "base_t_pot": rep.base_t_pot,
        "base_t_fault": rep.base_t_fault,
        "slider_percent": rep.slider_percent,
        "scale_applied": rep.scale_applied,
        "source": rep.threshold_source,
        "ratio": rep.ratio,
        "mean_ssim": rep.mean_ssim
    }

    # Persist anomalies.json
    anomalies_payload = {
        "runId": run_id,
        "inspectionId": inspection_id,
        "generatedAt": datetime.utcnow().isoformat() + 'Z',
        "imageLevelLabel": rep.image_level_label,
        "anomalies": anomalies_list,
        "thresholdsUsed": thresholds_used,
        "paths": {
            "baseline": run_baseline,
            "maintenance": run_maintenance,
            "overlay": run_overlay,
            "report": run_report
        }
    }
    try:
        with open(run_anomalies, 'w') as f:
            json.dump(anomalies_payload, f, indent=2)
    except Exception as e:
        return jsonify({"error": f"Failed to write anomalies file: {e}"}), 500

    # Update inspection index
    index_path = os.path.join(inspection_root, 'index.json')
    index_data = {"inspection_id": inspection_id, "runs": []}
    if os.path.exists(index_path):
        try:
            with open(index_path, 'r') as f:
                existing = json.load(f)
            if isinstance(existing, dict) and 'runs' in existing:
                index_data = existing
        except Exception:
            pass
    index_data.setdefault('runs', []).append({
        "run_id": run_id,
        "timestamp": datetime.utcnow().isoformat() + 'Z',
        "slider_percent": slider_percent_val,
        "baseline_source_type": baseline_source_type,
        "image_level_label": rep.image_level_label,
        "num_anomalies": len(anomalies_list),
        "paths": {
            "baseline": run_baseline,
            "maintenance": run_maintenance,
            "overlay": run_overlay,
            "report": run_report,
            "anomalies": run_anomalies
        },
        "thresholdsUsed": thresholds_used
    })
    try:
        with open(index_path, 'w') as f:
            json.dump(index_data, f, indent=2)
    except Exception as e:
        return jsonify({"error": f"Failed to update index: {e}"}), 500

    # Data URI for immediate display (optional) & asset URLs for efficient reloads
    overlay_data_uri = image_to_data_uri(run_overlay)
    base_asset_url = f"/inspection_asset/{inspection_id}/{run_id}"
    asset_urls = {
        "baseline": f"{base_asset_url}/baseline.png",
        "maintenance": f"{base_asset_url}/maintenance.png",
        "overlay": f"{base_asset_url}/overlay.png",
        "report": f"{base_asset_url}/report.json",
        "anomalies": f"{base_asset_url}/anomalies.json"
    }

    return jsonify({
        "runId": run_id,
        "annotatedImage": overlay_data_uri,  # backward compatibility
        "assetUrls": asset_urls,
        "anomalies": anomalies_list,
        "thresholdsUsed": thresholds_used,
        "imageLevelLabel": rep.image_level_label
    })

@app.route('/inspection_asset/<inspection_id>/<run_id>/<filename>', methods=['GET'])
def inspection_asset(inspection_id, run_id, filename):
    # Simple safe join to avoid traversal
    if any(p.startswith('..') or '/' in p or '\\' in p for p in (inspection_id, run_id, filename)):
        return jsonify({"error": "Invalid path"}), 400
    path = os.path.join(INSPECTIONS_DIR, inspection_id, 'runs', run_id, filename)
    if not os.path.exists(path):
        return jsonify({"error": "Not found"}), 404
    if filename.endswith('.png'):
        return send_file(path, mimetype='image/png')
    if filename.endswith('.json'):
        return send_file(path, mimetype='application/json')
    return send_file(path)

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