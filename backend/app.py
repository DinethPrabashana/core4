import os
import uuid
import json
import base64
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Import logic
from anomaly_cv import detect_anomalies, BlobDet
import database as db

# --- Flask App Setup ---

app = Flask(__name__)
# Enable CORS with proper configuration for all methods and headers
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Disposition"]
    },
    r"/analyze": {
        "origins": "*",
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Create a temporary directory for file processing if it doesn't exist
TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

# --- Database Initialization ---
# Check if the database file exists, if not, initialize it.
if not os.path.exists(db.DATABASE):
    print(f"Database not found. Initializing at {db.DATABASE}...")
    db.init_db()


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
    threshold = request.form.get('threshold', 0.5)
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
            out_json_path=report_path
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

        return jsonify({
            "annotatedImage": annotated_image_uri,
            "anomalies": anomalies_list
        })

    except Exception as e:
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500

    finally:
        # --- Cleanup ---
        # Clean up the temporary files after the request is complete
        for path in [baseline_path, maintenance_path, overlay_path, report_path]:
            if os.path.exists(path):
                os.remove(path)


# --- CRUD API for Transformers ---

@app.route('/api/transformers', methods=['GET', 'POST'])
def handle_transformers():
    if request.method == 'GET':
        transformers = db.get_all_transformers()
        # Attach latest inspection summary for each transformer to help frontend show persisted info
        enriched = []
        for t in transformers:
            latest = db.get_latest_inspection_for_transformer(t['id'])
            t_copy = dict(t)
            t_copy['latestInspection'] = latest
            enriched.append(t_copy)
        return jsonify(enriched)
    if request.method == 'POST':
        transformer_data = request.json
        saved_transformer = db.add_transformer(transformer_data)
        return jsonify(saved_transformer), 201

@app.route('/api/transformers/<int:id>', methods=['DELETE'])
def handle_transformer(id):
    if request.method == 'DELETE':
        db.delete_transformer(id)
        return jsonify({'message': 'Transformer deleted'}), 200

@app.route('/api/transformers/update_from_inspection', methods=['POST'])
def handle_transformer_update_from_inspection():
    data = request.json
    db.update_transformer_from_inspection(
        data['transformerId'],
        data['baselineImage'],
        data['baselineUploadDate'],
        data['weather']
    )
    return jsonify({'message': 'Transformer updated successfully'}), 200

# --- CRUD API for Inspections ---

@app.route('/api/inspections', methods=['GET', 'POST'])
def handle_inspections():
    if request.method == 'GET':
        inspections = db.get_all_inspections()
        return jsonify(inspections)
    if request.method == 'POST':
        inspection_data = request.json
        saved_inspection = db.add_inspection(inspection_data)
        return jsonify(saved_inspection), 201

@app.route('/api/inspections/<int:id>', methods=['PUT', 'DELETE'])
def handle_inspection(id):
    if request.method == 'PUT':
        inspection_data = request.json
        inspection_data['id'] = id
        db.update_inspection(inspection_data)
        return jsonify({'message': 'Inspection updated'}), 200
    if request.method == 'DELETE':
        db.delete_inspection(id)
        return jsonify({'message': 'Inspection deleted'}), 200

# --- Annotation API Endpoints ---

@app.route('/api/annotations/<int:inspection_id>', methods=['GET', 'POST'])
def handle_annotations(inspection_id):
    """Get or save annotations for a specific inspection."""
    try:
        if request.method == 'GET':
            annotations = db.get_annotations(inspection_id)
            return jsonify(annotations)
        
        if request.method == 'POST':
            data = request.json
            annotations = data.get('annotations', [])
            user_id = data.get('user_id', 'Admin')
            transformer_id = data.get('transformer_id')
            
            # Save annotations
            db.save_annotations(inspection_id, annotations, user_id)
            
            # Log the action for each annotation
            for annot in annotations:
                action_type = 'added' if annot.get('source') == 'user' else 'edited'
                if annot.get('deleted'):
                    action_type = 'deleted'
                
                # Prepare AI prediction and user annotation data
                ai_prediction = None
                user_annotation = annot.copy()
                
                if annot.get('source') == 'ai':
                    ai_prediction = {
                        'id': annot['id'],
                        'x': annot['x'],
                        'y': annot['y'],
                        'w': annot['w'],
                        'h': annot['h'],
                        'confidence': annot.get('confidence'),
                        'severity': annot.get('severity'),
                        'classification': annot.get('classification')
                    }
                
                db.log_annotation_action(
                    inspection_id=inspection_id,
                    transformer_id=transformer_id,
                    action_type=action_type,
                    annotation_data=annot,
                    ai_prediction=ai_prediction,
                    user_annotation=user_annotation,
                    user_id=user_id,
                    notes=annot.get('comment')
                )
            
            return jsonify({'message': 'Annotations saved successfully'}), 200
    except Exception as e:
        print(f"Error in handle_annotations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/annotation-logs', methods=['GET'])
def get_annotation_logs():
    """Get all annotation logs or filter by inspection_id."""
    try:
        inspection_id = request.args.get('inspection_id', type=int)
        logs = db.get_annotation_logs(inspection_id)
        return jsonify(logs)
    except Exception as e:
        print(f"Error in get_annotation_logs: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/annotation-logs/export/json', methods=['GET'])
def export_annotation_logs_json():
    """Export annotation logs as JSON."""
    json_data = db.export_annotation_logs_json()
    response = Response(json_data, mimetype='application/json')
    response.headers['Content-Disposition'] = 'attachment; filename=annotation_logs.json'
    return response

@app.route('/api/annotation-logs/export/csv', methods=['GET'])
def export_annotation_logs_csv():
    """Export annotation logs as CSV."""
    csv_data = db.export_annotation_logs_csv()
    response = Response(csv_data, mimetype='text/csv')
    response.headers['Content-Disposition'] = 'attachment; filename=annotation_logs.csv'
    return response


if __name__ == '__main__':
    # This makes the server accessible on your local network
    app.run(host='0.0.0.0', port=8000, debug=True)