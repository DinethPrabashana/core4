import os
import uuid
import json
import base64
import io
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Import logic
from anomaly_cv import detect_anomalies, BlobDet
import database as db

# PDF generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
    from reportlab.lib.units import inch
    from reportlab.lib.utils import ImageReader
    HAS_REPORTLAB = True
except Exception:
    # If reportlab isn't installed, PDF export endpoint will return a helpful error
    HAS_REPORTLAB = False
    # Define a safe fallback so module import doesn't fail on default params
    inch = 72

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
        first_only_raw = request.args.get('firstOnly', default='false')
        first_only = str(first_only_raw).lower() in ['1', 'true', 'yes', 'y']

        logs = db.get_annotation_logs(inspection_id)
        if first_only:
            # Keep the earliest occurrence for each (inspection_id, annotation_id, action_type)
            # Merge the first non-empty notes/comment to ensure context is present
            logs = db.first_occurrence_with_merged_notes(logs, sort_order='desc')
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

# --- Maintenance Records API (Phase 4) ---

@app.route('/api/records', methods=['GET', 'POST'])
def handle_records():
    if request.method == 'GET':
        transformer_id = request.args.get('transformer_id', type=int)
        inspection_id = request.args.get('inspection_id', type=int)
        records = db.list_maintenance_records(transformer_id=transformer_id, inspection_id=inspection_id)
        return jsonify(records)
    if request.method == 'POST':
        try:
            data = request.json or {}
            saved = db.add_maintenance_record(data)
            # If location wasn't persisted (older schema), propagate requested value for UI consistency
            if 'location' not in saved and data.get('location'):
                saved['location'] = data.get('location')
            return jsonify(saved), 201
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to save record', 'detail': str(e)}), 500

@app.route('/api/records/<int:record_id>', methods=['GET', 'PUT'])
def handle_record(record_id):
    if request.method == 'GET':
        rec = db.get_maintenance_record(record_id)
        if rec is None:
            return jsonify({'error': 'Not found'}), 404
        return jsonify(rec)
    if request.method == 'PUT':
        data = request.json
        rec = db.update_maintenance_record(record_id, data)
        if rec is None:
            return jsonify({'error': 'Not found'}), 404
        return jsonify(rec)

@app.route('/api/records/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    rec = db.get_maintenance_record(record_id)
    if rec is None:
        return jsonify({'error': 'Not found'}), 404
    db.delete_maintenance_record(record_id)
    return jsonify({'message': 'Record deleted'}), 200

## JSON/CSV export endpoints removed per requirement – keep PDF only.

def _build_inspection_number_map(transformer_id):
    conn = db.get_db_connection()
    try:
        t_row = conn.execute('SELECT id, number, location, type FROM transformers WHERE id = ?', (transformer_id,)).fetchone()
        transformer = dict(t_row) if t_row else {'id': transformer_id, 'number': str(transformer_id)}
        insp_rows = conn.execute('SELECT id FROM inspections WHERE transformer_id = ? ORDER BY id ASC', (transformer_id,)).fetchall()
        inspection_number_by_id = {}
        idx = 0
        for r in insp_rows:
            idx += 1
            inspection_number_by_id[r['id']] = f"{transformer['number']}-INSP{idx}"
        return transformer, inspection_number_by_id
    finally:
        conn.close()

def _image_from_data_uri(data_uri, max_width=5.5*inch):
    try:
        if not data_uri:
            return None
        if not isinstance(data_uri, str) or 'base64,' not in data_uri:
            return None
        b64 = data_uri.split('base64,', 1)[1]
        raw = base64.b64decode(b64)
        bio = io.BytesIO(raw)
        ir = ImageReader(bio)
        iw, ih = ir.getSize()
        scale = min(1.0, max_width / float(iw)) if iw else 1.0
        img = Image(ir, width=iw*scale, height=ih*scale)
        return img
    except Exception:
        return None

@app.route('/api/records/export/pdf', methods=['GET'])
def export_records_pdf():
    """Export maintenance records for a transformer (optionally one inspection) as a structured PDF."""
    transformer_id = request.args.get('transformer_id', type=int)
    if not transformer_id:
        return jsonify({'error': 'transformer_id is required'}), 400
    inspection_id = request.args.get('inspection_id', type=int)

    # Check reportlab availability
    if not HAS_REPORTLAB:
        return jsonify({'error': 'PDF generation requires reportlab. Please install it in backend (pip install reportlab).'}), 500

    transformer, insp_map = _build_inspection_number_map(transformer_id)

    # Fetch records via DB helper (includes parsed JSON fields)
    records = db.list_maintenance_records(transformer_id=transformer_id, inspection_id=inspection_id)
    if not records:
        return jsonify({'error': 'No records found for export'}), 404

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=42, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    title_style = styles['Heading1']
    h2 = styles['Heading2']
    normal = styles['BodyText']

    # Document title
    story.append(Paragraph(f"Maintenance Records – {transformer.get('number')} (#{transformer.get('id')})", title_style))
    if transformer.get('location') or transformer.get('type'):
        meta_line = f"Location: {transformer.get('location') or 'N/A'}  •  Type: {transformer.get('type') or 'N/A'}"
        story.append(Paragraph(meta_line, normal))
    story.append(Spacer(1, 8))

    for idx, rec in enumerate(records):
        insp_num = insp_map.get(rec.get('inspection_id'))
        heading = f"Record #{rec.get('id')}"
        if insp_num:
            heading += f" – {insp_num}"
        story.append(Spacer(1, 8 if idx == 0 else 16))
        story.append(Paragraph(heading, h2))

        # Key facts table
        krows = [
            ['Saved At', (rec.get('created_at') or rec.get('record_timestamp') or '')],
            ['Engineer', rec.get('engineer_name') or ''],
            ['Status', rec.get('status') or ''],
            ['Location', rec.get('location') or transformer.get('location') or ''],
        ]
        kt = Table(krows, colWidths=[90, 420])
        kt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
            ('INNERGRID', (0,0), (-1,-1), 0.25, colors.lightgrey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica')
        ]))
        story.append(kt)
        story.append(Spacer(1, 6))

        # Readings
        readings = rec.get('readings') or {}
        if isinstance(readings, dict) and readings:
            rrows = [['Reading', 'Value']]
            for k, v in readings.items():
                rrows.append([str(k), str(v)])
            rt = Table(rrows, colWidths=[120, 200])
            rt.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
                ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
                ('INNERGRID', (0,0), (-1,-1), 0.25, colors.lightgrey),
                ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ]))
            story.append(Paragraph('Readings', styles['Heading3']))
            story.append(rt)
            story.append(Spacer(1, 6))

        # Annotated image
        img = _image_from_data_uri(rec.get('annotated_image'))
        if img:
            story.append(Paragraph('Annotated Image', styles['Heading3']))
            story.append(img)
            story.append(Spacer(1, 6))

        # Anomalies table
        anomalies = rec.get('anomalies') or []
        if isinstance(anomalies, dict):
            anomalies = list(anomalies.values())
        anomalies = [a for a in anomalies if not a.get('deleted')]
        if anomalies:
            arows = [['#', 'Type', 'Severity', 'Comment', 'Position', 'Size']]
            for i, a in enumerate(anomalies, start=1):
                pos = f"({round(a.get('x',0))}, {round(a.get('y',0))})"
                size = f"{round(a.get('w',0))}×{round(a.get('h',0))}"
                arows.append([
                    str(i), a.get('classification') or '', a.get('severity') or '',
                    (a.get('comment') or ''), pos, size
                ])
            at = Table(arows, colWidths=[22, 90, 70, 240, 80, 60])
            at.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
                ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
                ('INNERGRID', (0,0), (-1,-1), 0.25, colors.lightgrey),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('FONTNAME', (0,0), (-1,-1), 'Helvetica')
            ]))
            story.append(Paragraph('Anomalies', styles['Heading3']))
            story.append(at)
            story.append(Spacer(1, 6))

        # Action and notes
        rec_act = rec.get('recommended_action') or ''
        rec_notes = rec.get('notes') or ''
        if rec_act:
            story.append(Paragraph('Recommended Action', styles['Heading3']))
            story.append(Paragraph(rec_act.replace('\n', '<br/>'), normal))
            story.append(Spacer(1, 4))
        if rec_notes:
            story.append(Paragraph('Notes', styles['Heading3']))
            story.append(Paragraph(rec_notes.replace('\n', '<br/>'), normal))

        if idx < len(records) - 1:
            story.append(PageBreak())

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    suffix = f"_insp{inspection_id}" if inspection_id else ""
    resp = Response(pdf, mimetype='application/pdf')
    resp.headers['Content-Disposition'] = f'attachment; filename=maintenance_records_t{transformer_id}{suffix}.pdf'
    return resp


if __name__ == '__main__':
    # This makes the server accessible on your local network
    app.run(host='0.0.0.0', port=8000, debug=True)