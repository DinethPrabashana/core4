# anomaly_cv.py
import json, math, sys
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Any
import numpy as np
import cv2 as cv
from skimage.metrics import structural_similarity as ssim
from skimage.color import rgb2lab, deltaE_ciede2000

# ---------- Data structures ----------
@dataclass
class BlobDet:
    label: int
    bbox: Tuple[int,int,int,int]   # x,y,w,h
    area: int
    centroid: Tuple[float,float]
    mean_deltaE: float
    peak_deltaE: float
    mean_hsv: Tuple[float,float,float]
    elongation: float              # major/minor axis ratio
    classification: str            # Normal/Faulty/Potentially Faulty
    subtype: str                   # LooseJoint / PointOverload / FullWireOverload / None
    confidence: float              # 0..1
    severity: float                # 0..100

@dataclass
class DetectionReport:
    transformer_id: str
    baseline_path: str
    maintenance_path: str
    warp_model: str
    warp_success: bool
    warp_score: float
    mean_ssim: float
    image_level_label: str
    blobs: List[BlobDet]

# ---------- Utilities ----------
def read_bgr(path: str) -> np.ndarray:
    img = cv.imread(path, cv.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(path)
    return img

def to_gray(img_bgr: np.ndarray) -> np.ndarray:
    return cv.cvtColor(img_bgr, cv.COLOR_BGR2GRAY)

def ecc_align(base_gray: np.ndarray, mov_gray: np.ndarray) -> Tuple[np.ndarray, np.ndarray, bool, float]:
    """
    Try ECC alignment (affine). If it fails, fall back to ORB+RANSAC homography.
    Returns: (warp_matrix, aligned_gray, ok, score)
      - warp_matrix is 2x3 (affine) or 3x3 (homography)
      - score is ECC correlation for ECC; 0.0 for homography fallback
    """
    # ECC (area/intensity-based) alignment for small pose differences.
    # Docs: findTransformECC (area-based alignment). 
    # Ref: OpenCV docs/group__video__track (findTransformECC).  :contentReference[oaicite:1]{index=1}
    warp_mode = cv.MOTION_AFFINE
    warp = np.eye(2, 3, dtype=np.float32)
    criteria = (cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 200, 1e-6)
    try:
        cc, warp = cv.findTransformECC(base_gray, mov_gray, warp, warp_mode, criteria)
        aligned = cv.warpAffine(
            mov_gray, warp,
            (base_gray.shape[1], base_gray.shape[0]),
            flags=cv.INTER_LINEAR + cv.WARP_INVERSE_MAP
        )
        return warp, aligned, True, float(cc)
    except cv.error:
        # ORB + RANSAC Homography (feature-based) fallback.
        orb = cv.ORB_create(5000)
        k1, d1 = orb.detectAndCompute(base_gray, None)
        k2, d2 = orb.detectAndCompute(mov_gray, None)
        if d1 is None or d2 is None:
            return np.eye(2,3,np.float32), mov_gray, False, 0.0

        matcher = cv.BFMatcher(cv.NORM_HAMMING, crossCheck=True)
        matches = matcher.match(d1, d2)
        matches = sorted(matches, key=lambda m: m.distance)[:500]
        if len(matches) < 8:
            return np.eye(2,3,np.float32), mov_gray, False, 0.0

        pts1 = np.float32([k1[m.queryIdx].pt for m in matches])
        pts2 = np.float32([k2[m.trainIdx].pt for m in matches])
        H, mask = cv.findHomography(pts2, pts1, cv.RANSAC, 3.0)
        if H is None:
            return np.eye(2,3,np.float32), mov_gray, False, 0.0

        aligned = cv.warpPerspective(
            mov_gray, H,
            (base_gray.shape[1], base_gray.shape[0])
        )
        # IMPORTANT FIX: return full 3x3 homography (not a 2x3 slice).
        return H.astype(np.float32), aligned, True, 0.0

def lab_and_hsv(img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    img_rgb = cv.cvtColor(img_bgr, cv.COLOR_BGR2RGB)
    lab = rgb2lab(img_rgb)  # LAB for ΔE2000 computation
    hsv = cv.cvtColor(img_bgr, cv.COLOR_BGR2HSV)
    return lab, hsv

def deltaE_map(lab_base: np.ndarray, lab_maint: np.ndarray) -> np.ndarray:
    # Vectorized ΔE2000 across image
    return deltaE_ciede2000(lab_base, lab_maint).astype(np.float32)

def hot_color_mask(hsv: np.ndarray) -> np.ndarray:
    # Reds/oranges/yellows in OpenCV HSV (H:0..179).
    m_red1   = cv.inRange(hsv, (0,   90, 120), (10,  255, 255))
    m_red2   = cv.inRange(hsv, (170, 90, 120), (179, 255, 255))
    m_orange = cv.inRange(hsv, (11,  80, 120), (25,  255, 255))
    m_yellow = cv.inRange(hsv, (26,  60, 120), (35,  255, 255))
    mask = cv.bitwise_or(cv.bitwise_or(m_red1, m_red2), cv.bitwise_or(m_orange, m_yellow))
    return mask

def morphology_clean(mask: np.ndarray) -> np.ndarray:
    k = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3,3))
    mask = cv.morphologyEx(mask, cv.MORPH_OPEN, k, iterations=1)
    mask = cv.morphologyEx(mask, cv.MORPH_CLOSE, k, iterations=2)
    return mask

def blob_props(bin_mask: np.ndarray, dE: np.ndarray, hsv: np.ndarray) -> List[Dict[str,Any]]:
    # Connected components and basic stats
    # Ref: connectedComponentsWithStats. :contentReference[oaicite:2]{index=2}
    n, labels, stats, centroids = cv.connectedComponentsWithStats(bin_mask, connectivity=8)
    out = []
    for lab in range(1, n):
        x,y,w,h,area = stats[lab]
        if area < 25:    # ignore tiny speckles
            continue
        roi = (labels[y:y+h, x:x+w] == lab)
        dE_roi = dE[y:y+h, x:x+w][roi]
        hsv_roi = hsv[y:y+h, x:x+w][roi]
        mean_dE = float(dE_roi.mean())
        peak_dE = float(dE_roi.max())
        mean_h = float(hsv_roi[:,0].mean()); mean_s = float(hsv_roi[:,1].mean()); mean_v = float(hsv_roi[:,2].mean())

        # Elongation via covariance eigenvalue ratio
        pts = np.column_stack(np.where(roi))
        if len(pts) >= 10:
            cov = np.cov(pts.astype(np.float32).T)
            eigvals,_ = np.linalg.eig(cov)
            eigvals = np.sort(np.abs(eigvals))
            elong = float((eigvals[-1]+1e-6)/(eigvals[0]+1e-6))
        else:
            elong = 1.0

        out.append(dict(label=lab, bbox=(int(x),int(y),int(w),int(h)), area=int(area),
                        centroid=(float(centroids[lab][0]), float(centroids[lab][1])),
                        mean_deltaE=mean_dE, peak_deltaE=peak_dE,
                        mean_hsv=(mean_h, mean_s, mean_v), elongation=elong))
    return out

# ---------- Rule-based classification ----------
def classify_blob(b: Dict[str,Any], dE_thr_fault=12.0, dE_thr_pot=8.0) -> Tuple[str,str,float,float]:
    """
    Returns (label, subtype, confidence, severity)
    label: 'Faulty' | 'Potentially Faulty' | 'Normal'
    subtype: 'LooseJoint' | 'PointOverload' | 'FullWireOverload' | 'None'
    """
    h,s,v = b['mean_hsv']
    elong = b['elongation']
    peak, mean = b['peak_deltaE'], b['mean_deltaE']

    # color band heuristics (OpenCV H ∈ [0..179])
    is_red_or_orange = (h <= 10 or h >= 170 or (11 <= h <= 25))
    is_yellowish     = (26 <= h <= 35)

    # shape cues
    wire_like = elong >= 3.0
    joint_like = not wire_like

    # Faulty (red/orange + strong ΔE)
    if is_red_or_orange and peak >= dE_thr_fault:
        if joint_like:
            subtype = 'LooseJoint'
        else:
            subtype = 'PointOverload' if b['area'] < 0.15 * (b['bbox'][2]*b['bbox'][3]) else 'FullWireOverload'
        label = 'Faulty'

    # Potential (yellowish + moderate ΔE OR elongated warm segment)
    elif (is_yellowish and peak >= dE_thr_pot) or (wire_like and mean >= dE_thr_pot):
        subtype = 'LooseJoint' if joint_like else 'FullWireOverload'
        label = 'Potentially Faulty'

    else:
        return 'Normal', 'None', 0.3, 10.0

    # Confidence & severity
    color_bonus = 0.15 if is_red_or_orange else (0.05 if is_yellowish else 0.0)
    conf = 0.5 + 0.5 * np.tanh((peak - dE_thr_pot)/8.0) + color_bonus
    conf = float(np.clip(conf, 0.0, 1.0))
    sev  = float(np.clip((0.6*peak + 0.4*mean) + 0.005*b['area'], 0, 100))
    return label, subtype, conf, sev

def summarize_image(blobs: List[BlobDet]) -> str:
    if any(b.classification == 'Faulty' for b in blobs): return 'Faulty'
    if any(b.classification == 'Potentially Faulty' for b in blobs): return 'Potentially Faulty'
    return 'Normal'

def overlay_detections(img_bgr: np.ndarray, blobs: List[BlobDet]) -> np.ndarray:
    out = img_bgr.copy()
    for b in blobs:
        x,y,w,h = b.bbox
        color = (0,0,255) if b.classification=='Faulty' else ((0,165,255) if b.classification=='Potentially Faulty' else (0,255,0))
        cv.rectangle(out, (x,y), (x+w,y+h), color, 2)
        label = f"{b.classification}:{b.subtype} pΔE={b.peak_deltaE:.1f} conf={b.confidence:.2f}"
        cv.putText(out, label, (x, max(0,y-5)), cv.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv.LINE_AA)
    return out

# ---------- Main entry ----------
def detect_anomalies(transformer_id: str, baseline_path: str, maintenance_path: str,
                     out_overlay_path: str, out_json_path: str) -> DetectionReport:

    base_bgr = read_bgr(baseline_path)
    ment_bgr = read_bgr(maintenance_path)

    # Align maintenance to baseline (gray)
    base_gray = to_gray(base_bgr)
    ment_gray = to_gray(ment_bgr)
    warp, ment_aligned_gray, ok, score = ecc_align(base_gray, ment_gray)

    # Apply the SAME warp to color for consistent SSIM/ΔE geometry
    H, W = base_gray.shape
    if warp.shape == (3,3):  # homography case
        # Ref: warpPerspective expects 3x3. :contentReference[oaicite:3]{index=3}
        ment_aligned_bgr = cv.warpPerspective(
            ment_bgr, warp, (W, H),
            flags=cv.INTER_LINEAR + cv.WARP_INVERSE_MAP
        )
        warp_model = 'homography'
    elif warp.shape == (2,3):  # affine case
        ment_aligned_bgr = cv.warpAffine(
            ment_bgr, warp, (W, H),
            flags=cv.INTER_LINEAR + cv.WARP_INVERSE_MAP
        )
        warp_model = 'affine'
    else:
        raise ValueError("Unexpected warp shape")

    # SSIM sanity (structure similarity)
    # Ref: skimage.metrics.structural_similarity. :contentReference[oaicite:4]{index=4}
    mean_ssim, _ = ssim(base_gray, ment_aligned_gray, full=True, data_range=255)

    # Convert to LAB/HSV
    base_lab, _ = lab_and_hsv(base_bgr)
    ment_lab, ment_hsv = lab_and_hsv(ment_aligned_bgr)

    # ΔE2000 map
    dE = deltaE_map(base_lab, ment_lab)

    # Hot color gating + ΔE threshold (adaptive to SSIM)
    t_pot  = 8.0  if mean_ssim >= 0.70 else 10.0
    t_fault = 12.0 if mean_ssim >= 0.70 else 14.0
    mask_hot = hot_color_mask(ment_hsv)
    mask_delta = (dE >= t_pot).astype(np.uint8)*255
    mask = cv.bitwise_and(mask_hot, mask_delta)
    mask = morphology_clean(mask)

    # Blob analysis
    props = blob_props(mask, dE, ment_hsv)
    blobs: List[BlobDet] = []
    for p in props:
        cls, subtype, conf, sev = classify_blob(p, dE_thr_fault=t_fault, dE_thr_pot=t_pot)
        blobs.append(BlobDet(label=p['label'], bbox=p['bbox'], area=p['area'],
                             centroid=p['centroid'], mean_deltaE=p['mean_deltaE'], peak_deltaE=p['peak_deltaE'],
                             mean_hsv=p['mean_hsv'], elongation=p['elongation'],
                             classification=cls, subtype=subtype, confidence=conf, severity=sev))

    # Image-level summary & outputs
    image_label = summarize_image(blobs)
    overlay = overlay_detections(ment_aligned_bgr, blobs)
    cv.imwrite(out_overlay_path, overlay)

    rep = DetectionReport(
        transformer_id=transformer_id,
        baseline_path=baseline_path,
        maintenance_path=maintenance_path,
        warp_model=warp_model,
        warp_success=bool(ok),
        warp_score=float(score),
        mean_ssim=float(mean_ssim),
        image_level_label=image_label,
        blobs=blobs
    )

    with open(out_json_path, "w") as f:
        json.dump({
            **{k:v for k,v in asdict(rep).items() if k!='blobs'},
            "blobs": [asdict(b) for b in blobs]
        }, f, indent=2)

    return rep

if __name__ == "__main__":
    # Example:
    # python anomaly_cv.py TX001 baseline.jpg maintenance.jpg out_overlay.png out_report.json
    if len(sys.argv) != 6:
        print("Usage: python anomaly_cv.py <transformer_id> <baseline.jpg> <maintenance.jpg> <overlay.png> <report.json>")
        sys.exit(1)
    _, txid, bpath, mpath, opath, jpath = sys.argv
    rep = detect_anomalies(txid, bpath, mpath, opath, jpath)
    print(f"Result: {rep.image_level_label} | blobs={len(rep.blobs)} | SSIM={rep.mean_ssim:.3f} | warp={rep.warp_model}")
