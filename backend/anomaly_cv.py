# anomaly_cv.py
import json, math, sys
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Any
import numpy as np
import cv2 as cv
from skimage.metrics import structural_similarity as ssim
from skimage.color import rgb2lab, deltaE_ciede2000
from skimage.morphology import skeletonize  # for wire centerlines

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
    # --- Added threshold metadata ---
    t_pot: float
    t_fault: float
    base_t_pot: float
    base_t_fault: float
    slider_percent: float | None
    scale_applied: float | None
    threshold_source: str
    ratio: float

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
    Robust alignment:
      1) ECC on Canny edges with an inputMask (ignores legend/sky).
      2) Fallback: ORB + KNN (Lowe ratio) + RANSAC homography.
    Returns: (warp_matrix, aligned_gray, ok, score)
      - warp_matrix is 2x3 (affine) or 3x3 (homography)
      - score is ECC correlation for ECC; 0.0 for homography fallback
    """
    H, W = base_gray.shape

    # Mask: keep transformer region, drop right colorbar + top sky band (tune as needed)
    inputMask = np.ones_like(base_gray, np.uint8) * 255
    inputMask[:, int(0.88 * W):] = 0   # right 12% (palette/legend)
    inputMask[:int(0.15 * H), :] = 0   # top 15% (sky/roof band)

    # Edge images (photometrically robust)
    base_e = cv.Canny(base_gray, 50, 150)
    mov_e  = cv.Canny(mov_gray,  50, 150)

    warp_mode = cv.MOTION_AFFINE
    warp = np.eye(2, 3, dtype=np.float32)
    criteria = (cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 300, 1e-6)

    try:
        cc, warp = cv.findTransformECC(
            base_e, mov_e, warp, warp_mode, criteria, inputMask=inputMask
        )
        aligned = cv.warpAffine(
            mov_gray, warp, (W, H),
            flags=cv.INTER_LINEAR + cv.WARP_INVERSE_MAP
        )
        return warp, aligned, True, float(cc)
    except cv.error:
        # Feature fallback: ORB + KNN(Lowe ratio) + RANSAC Homography
        orb = cv.ORB_create(5000)
        k1, d1 = orb.detectAndCompute(base_gray, None)
        k2, d2 = orb.detectAndCompute(mov_gray,  None)
        if d1 is None or d2 is None:
            return np.eye(2,3,np.float32), mov_gray, False, 0.0

        bf = cv.BFMatcher(cv.NORM_HAMMING, crossCheck=False)
        knn = bf.knnMatch(d1, d2, k=2)
        good = [m for m,n in knn if n is not None and m.distance < 0.75 * n.distance]
        if len(good) < 8:
            return np.eye(2,3,np.float32), mov_gray, False, 0.0

        pts1 = np.float32([k1[m.queryIdx].pt for m in good])
        pts2 = np.float32([k2[m.trainIdx].pt for m in good])
        Hm, mask = cv.findHomography(pts2, pts1, cv.RANSAC, 3.0)
        if Hm is None:
            return np.eye(2,3,np.float32), mov_gray, False, 0.0

        aligned = cv.warpPerspective(mov_gray, Hm, (W, H))
        return Hm.astype(np.float32), aligned, True, 0.0

def lab_and_hsv(img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    img_rgb = cv.cvtColor(img_bgr, cv.COLOR_BGR2RGB)
    lab = rgb2lab(img_rgb)  # LAB for ΔE2000 computation
    hsv = cv.cvtColor(img_bgr, cv.COLOR_BGR2HSV)
    return lab, hsv

def deltaE_map(lab_base: np.ndarray, lab_maint: np.ndarray) -> np.ndarray:
    return deltaE_ciede2000(lab_base, lab_maint).astype(np.float32)

def hot_color_mask(hsv: np.ndarray) -> np.ndarray:
    m_red1   = cv.inRange(hsv, (0,   90, 120), (10,  255, 255))
    m_red2   = cv.inRange(hsv, (170, 90, 120), (179, 255, 255))
    m_orange = cv.inRange(hsv, (11,  80, 120), (25,  255, 255))
    m_yellow = cv.inRange(hsv, (26,  60, 120), (35,  255, 255))
    return cv.bitwise_or(cv.bitwise_or(m_red1, m_red2), cv.bitwise_or(m_orange, m_yellow))

def morphology_clean(mask: np.ndarray) -> np.ndarray:
    k = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3,3))
    mask = cv.morphologyEx(mask, cv.MORPH_OPEN, k, iterations=1)
    mask = cv.morphologyEx(mask, cv.MORPH_CLOSE, k, iterations=2)
    return mask

def blob_props(bin_mask: np.ndarray, dE: np.ndarray, hsv: np.ndarray) -> List[Dict[str,Any]]:
    n, labels, stats, centroids = cv.connectedComponentsWithStats(bin_mask, connectivity=8)
    out = []
    for lab in range(1, n):
        x,y,w,h,area = stats[lab]
        if area < 25:
            continue
        roi = (labels[y:y+h, x:x+w] == lab)
        dE_roi = dE[y:y+h, x:x+w][roi]
        hsv_roi = hsv[y:y+h, x:x+w][roi]
        mean_dE = float(dE_roi.mean()) if dE_roi.size else 0.0
        peak_dE = float(dE_roi.max()) if dE_roi.size else 0.0
        mean_h = float(hsv_roi[:,0].mean()) if hsv_roi.size else 0.0
        mean_s = float(hsv_roi[:,1].mean()) if hsv_roi.size else 0.0
        mean_v = float(hsv_roi[:,2].mean()) if hsv_roi.size else 0.0

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

# ---------- Topology helpers (wire skeleton, joints, coverage) ----------
def build_wire_skeleton(img_bgr: np.ndarray, hot_mask: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    gray = cv.cvtColor(img_bgr, cv.COLOR_BGR2GRAY)
    edges = cv.Canny(gray, 50, 150)
    k3 = cv.getStructuringElement(cv.MORPH_RECT, (3,3))
    k5 = cv.getStructuringElement(cv.MORPH_RECT, (5,5))
    edges = cv.dilate(edges, k3, iterations=1)
    hot_dil = cv.dilate(hot_mask, k5, iterations=1)
    union = cv.bitwise_or(edges, hot_dil)
    skel_bool = skeletonize((union > 0).astype(np.uint8).astype(bool))
    skel = (skel_bool.astype(np.uint8) * 255)
    wire_band = cv.dilate(skel, k3, iterations=1)
    return skel, wire_band

def _neighbors8(y: int, x: int, h: int, w: int):
    for dy in (-1,0,1):
        for dx in (-1,0,1):
            if dy==0 and dx==0: continue
            ny, nx = y+dy, x+dx
            if 0 <= ny < h and 0 <= nx < w:
                yield ny, nx

def find_skeleton_nodes(skel: np.ndarray) -> Tuple[List[Tuple[int,int]], List[Tuple[int,int]]]:
    s = (skel > 0).astype(np.uint8)
    H, W = s.shape
    endpoints, junctions = [], []
    ys, xs = np.where(s)
    for y, x in zip(ys, xs):
        deg = 0
        for ny, nx in _neighbors8(y, x, H, W):
            if s[ny, nx]: deg += 1
        if deg == 1:
            endpoints.append((x, y))
        elif deg >= 3:
            junctions.append((x, y))
    return endpoints, junctions

def is_near_joint(centroid_xy: Tuple[float,float], joints: List[Tuple[int,int]], r: int = 8) -> bool:
    cx, cy = centroid_xy
    for jx, jy in joints:
        if (cx - jx)**2 + (cy - jy)**2 <= r*r:
            return True
    return False

def wire_hot_coverage(bbox: Tuple[int,int,int,int], skel: np.ndarray, hot_mask: np.ndarray,
                      expand: int = 10) -> Tuple[float, int, int, float]:
    H, W = skel.shape
    x,y,w,h = bbox
    x0 = max(0, x - expand); y0 = max(0, y - expand)
    x1 = min(W, x + w + expand); y1 = min(H, y + h + expand)

    skel_roi = skel[y0:y1, x0:x1] > 0
    hot_roi  = hot_mask[y0:y1, x0:x1] > 0

    k3 = cv.getStructuringElement(cv.MORPH_RECT, (3,3))
    hot_roi_d = cv.dilate((hot_roi.astype(np.uint8))*255, k3, iterations=1) > 0

    wire_len = int(skel_roi.sum())
    hot_len  = int((skel_roi & hot_roi_d).sum())
    coverage = (hot_len / wire_len) if wire_len > 0 else 0.0

    band = cv.dilate((skel_roi.astype(np.uint8))*255, k3, iterations=1) > 0
    cool_pixels = int((band & (~hot_roi)).sum())
    total_band  = int(band.sum())
    cool_frac = (cool_pixels / total_band) if total_band > 0 else 0.0
    return float(coverage), hot_len, wire_len, float(cool_frac)

# ---------- Enhanced rule-based classification ----------
def classify_blob_enhanced(
    b: Dict[str,Any],
    dE_thr_fault=12.0,
    dE_thr_pot=8.0,
    skel: np.ndarray = None,
    joints: List[Tuple[int,int]] = None,
    hot_mask: np.ndarray = None,
    abs_hot_mask: np.ndarray = None
) -> Tuple[str,str,float,float]:
    """
    Returns (label, subtype, confidence, severity)
    Adds promotions using maintenance-only absolute heat and topology.
    """
    h,s,v = b['mean_hsv']
    elong = b['elongation']
    peak, mean = b['peak_deltaE'], b['mean_deltaE']

    # Color bands (OpenCV Hue 0..179)
    is_red_or_orange = (h <= 10 or h >= 170 or (11 <= h <= 25))
    is_yellowish     = (26 <= h <= 35)

    # Base severity via ΔE + color (as before)
    faulty = is_red_or_orange and (peak >= dE_thr_fault)
    potential = (is_yellowish and peak >= dE_thr_pot) or ((elong >= 3.0) and mean >= dE_thr_pot)

    # Topology cues
    near_joint = False
    coverage = 0.0
    cool_frac = 0.0
    if skel is not None and hot_mask is not None and joints is not None:
        near_joint = is_near_joint(b['centroid'], joints, r=8)
        coverage, hot_len, wire_len, cool_frac = wire_hot_coverage(b['bbox'], skel, hot_mask, expand=10)

    subtype = 'None'
    label = 'Normal'

    if near_joint:
        subtype = 'LooseJoint'
        if faulty: label = 'Faulty'
        elif potential: label = 'Potentially Faulty'
    else:
        FULL_COVER_THR = 0.60
        POINT_COVER_THR = 0.25
        REST_COOL_THR = 0.60
        if coverage >= FULL_COVER_THR:
            subtype = 'FullWireOverload'
            label = 'Potentially Faulty' if (faulty or potential) else 'Normal'
        elif (coverage < POINT_COVER_THR and cool_frac >= REST_COOL_THR):
            subtype = 'PointOverload'
            if faulty: label = 'Faulty'
            elif potential: label = 'Potentially Faulty'
        else:
            subtype = 'PointOverload' if (faulty or potential) else 'None'
            if faulty: label = 'Faulty'
            elif potential: label = 'Potentially Faulty'

    # ---------- Promotion using maintenance-only absolute heat ----------
    if label == 'Normal' and abs_hot_mask is not None:
        x,y,w,h_box = b['bbox']
        abs_roi = abs_hot_mask[y:y+h_box, x:x+w]
        abs_frac = float(abs_roi.sum()) / float(max(1, w*h_box) * 255.0)  # fraction of hot pixels in bbox
        mean_v = b['mean_hsv'][2]  # mean V over blob (hot region)

        # Promote to LooseJoint (Faulty) if very hot and at a joint
        if near_joint and (mean_v >= 200 or abs_frac >= 0.20):
            label, subtype = 'Faulty', 'LooseJoint'

        # Promote to PointOverload (Faulty) if localized hot spot on otherwise cool wire
        elif (coverage < 0.25 and cool_frac >= 0.60 and abs_frac >= 0.20):
            label, subtype = 'Faulty', 'PointOverload'

        # Promote to FullWireOverload (Potential) if large coverage but ΔE was suppressed
        elif coverage >= 0.60 and abs_frac >= 0.40:
            label, subtype = 'Potentially Faulty', 'FullWireOverload'
    # ----------------------------------------------------

    # Confidence & severity
    color_bonus = 0.15 if is_red_or_orange else (0.05 if is_yellowish else 0.0)
    conf = 0.5 + 0.5 * np.tanh((peak - dE_thr_pot)/8.0) + color_bonus
    if subtype == 'FullWireOverload' and coverage >= 0.6: conf += 0.07
    if subtype == 'PointOverload' and coverage < 0.25 and cool_frac >= 0.6: conf += 0.07
    if subtype == 'LooseJoint' and near_joint: conf += 0.05
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
                     out_overlay_path: str, out_json_path: str,
                     slider_percent: float | None = None) -> DetectionReport:

    base_bgr = read_bgr(baseline_path)
    ment_bgr = read_bgr(maintenance_path)

    # Pre-resize maintenance to baseline size (critical when resolutions differ a lot)
    base_gray = to_gray(base_bgr)
    ment_gray = to_gray(ment_bgr)
    if ment_gray.shape != base_gray.shape:
        Hs, Ws = base_gray.shape
        ment_bgr = cv.resize(ment_bgr, (Ws, Hs), interpolation=cv.INTER_LINEAR)
        ment_gray = cv.resize(ment_gray, (Ws, Hs), interpolation=cv.INTER_LINEAR)

    # Align maintenance to baseline (robust ECC + feature fallback)
    warp, ment_aligned_gray, ok, score = ecc_align(base_gray, ment_gray)

    # Apply the SAME warp to color for consistent SSIM/ΔE geometry
    H, W = base_gray.shape
    if warp.shape == (3,3):  # homography case
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
    mean_ssim, _ = ssim(base_gray, ment_aligned_gray, full=True, data_range=255)

    # --- Base adaptive thresholds ---
    base_t_pot  = 8.0  if mean_ssim >= 0.70 else 10.0
    base_t_fault = 12.0 if mean_ssim >= 0.70 else 14.0
    ratio = base_t_fault / base_t_pot

    threshold_source = "adaptive_ssim"
    scale_applied = None
    if slider_percent is not None:
        try:
            p = float(slider_percent)
        except (TypeError, ValueError):
            p = None
        if p is not None:
            p = max(0.0, min(100.0, p))
            scale_applied = 1.2 - 0.4*(p/100.0)  # p=100 -> 0.8 (more sensitive), p=0 -> 1.2 (stricter)
            t_pot = base_t_pot * scale_applied
            if mean_ssim >= 0.70:
                t_pot = float(np.clip(t_pot, 6.0, 11.0))
            else:
                t_pot = float(np.clip(t_pot, 8.0, 13.0))
            t_fault = t_pot * ratio
            threshold_source = "slider_scaled"
        else:
            t_pot = base_t_pot
            t_fault = base_t_fault
    else:
        t_pot = base_t_pot
        t_fault = base_t_fault

    # --- Palette mismatch softening (scene histogram correlation) ---
    hist_b = cv.calcHist([base_gray],[0],None,[64],[0,256]);  hist_b = cv.normalize(hist_b, None).flatten()
    hist_m = cv.calcHist([ment_aligned_gray],[0],None,[64],[0,256]);  hist_m = cv.normalize(hist_m, None).flatten()
    hist_corr = float(np.corrcoef(hist_b, hist_m)[0,1])
    if hist_corr < 0.60:  # tune 0.55–0.70 depending on data
        t_pot   = max(6.0,  t_pot   - 2.0)
        t_fault = max(10.0, t_fault - 2.0)
        threshold_source += "+palette_soften"

    # Convert to LAB/HSV after thresholds decided
    base_lab, _ = lab_and_hsv(base_bgr)
    ment_lab, ment_hsv = lab_and_hsv(ment_aligned_bgr)

    # ΔE2000 map
    dE = deltaE_map(base_lab, ment_lab)

    # Hot color gating + ΔE threshold
    mask_hot = hot_color_mask(ment_hsv)
    mask_delta = (dE >= t_pot).astype(np.uint8)*255
    mask = cv.bitwise_and(mask_hot, mask_delta)
    mask = morphology_clean(mask)

    # --- Absolute hotness (maintenance-only) for promotions ---
    hch, sch, vch = cv.split(ment_hsv)
    v98 = float(np.percentile(vch, 98))
    abs_hot = (
        ((hch <= 10) | (hch >= 170) | ((hch >= 11) & (hch <= 25))) &  # red/orange
        (sch >= 80) &
        (vch >= max(200.0, v98))
    ).astype(np.uint8) * 255

    # --- Build wire skeleton & joints from the aligned maintenance image ---
    skel, wire_band = build_wire_skeleton(ment_aligned_bgr, mask)
    endpoints, junctions = find_skeleton_nodes(skel)
    joints = endpoints + junctions  # treat both as "joint" candidates

    # Blob analysis
    props = blob_props(mask, dE, ment_hsv)
    blobs: List[BlobDet] = []
    for p in props:
        cls, subtype, conf, sev = classify_blob_enhanced(
            p, dE_thr_fault=t_fault, dE_thr_pot=t_pot,
            skel=skel, joints=joints, hot_mask=mask, abs_hot_mask=abs_hot
        )
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
        blobs=blobs,
        t_pot=float(t_pot),
        t_fault=float(t_fault),
        base_t_pot=float(base_t_pot),
        base_t_fault=float(base_t_fault),
        slider_percent=float(slider_percent) if slider_percent is not None else None,
        scale_applied=float(scale_applied) if scale_applied is not None else None,
        threshold_source=threshold_source,
        ratio=float(ratio)
    )

    with open(out_json_path, "w") as f:
        json.dump({
            **{k:v for k,v in asdict(rep).items() if k!='blobs'},
            "blobs": [asdict(b) for b in blobs],
            "thresholds_used": {
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
        }, f, indent=2)

    return rep

if __name__ == "__main__":
    # Example:
    # python anomaly_cv.py TX001 baseline.jpg maintenance.jpg out_overlay.png out_report.json [slider_percent]
    if len(sys.argv) not in (6,7):
        print("Usage: python anomaly_cv.py <transformer_id> <baseline.jpg> <maintenance.jpg> <overlay.png> <report.json> [slider_percent]")
        sys.exit(1)
    _, txid, bpath, mpath, opath, jpath, *rest = sys.argv
    slider_arg = float(rest[0]) if rest else None
    rep = detect_anomalies(txid, bpath, mpath, opath, jpath, slider_percent=slider_arg)
    print(f"Result: {rep.image_level_label} | blobs={len(rep.blobs)} | SSIM={rep.mean_ssim:.3f} | warp={rep.warp_model} | t_pot={rep.t_pot:.2f} t_fault={rep.t_fault:.2f} (src={rep.threshold_source})")
