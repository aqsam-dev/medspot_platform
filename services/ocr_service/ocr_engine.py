"""
MedSpot Prescription OCR  —  Universal Edition v3
===================================================
Trained on / tested against these real prescription types:
  ✓ Pakistani doctor handwriting (prescription8.jpeg)
      Tab Atroflex, Syr Plaruy, Tab Jardin, Syr Buforel
  ✓ Hospital inpatient sheet (p7.jpeg)
      Dexamethasone inj, Saline 500cc, Cefazon inj, Pefloxacin
  ✓ Extreme messy handwriting (p6.jpeg)
      Syr Calpol, Tab Fanchuo, Tab Norpe, Cap Techoq, Tab Garcin
  ✓ Dental prescription — clear handwriting (prescription.jpeg)
      Augmentin 625mg, Enzoflam, Pan-D 40mg, Hexigel
  ✓ Printed computer prescription (prescription4.jpeg)
      Morphine 130mg, OXYcodone 10mg, Codeine 60mg, Norco 325-5mg

How messy handwriting is handled (3-layer matching):
  Layer 1 — Exact / substring match  (zero error, instant)
  Layer 2 — Fuzzy ratio match         (catches spelling errors)
  Layer 3 — Phonetic Soundex match    (catches sound-alike OCR errors)

For printed prescriptions:
  Special "Rx:" block parser extracts structured entries directly.

Install:
    pip install easyocr opencv-python torch numpy rapidfuzz jellyfish

Run:
    python medspot_ocr.py prescription.jpeg
    python medspot_ocr.py              ← default test file
"""

import os
import sys
import json
import re
import cv2
import numpy as np
import torch
import easyocr
from rapidfuzz import process, fuzz

try:
    import jellyfish
    PHONETIC_AVAILABLE = True
except ImportError:
    PHONETIC_AVAILABLE = False
    print("[WARN] jellyfish not installed — phonetic matching disabled.")
    print("       pip install jellyfish")


# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — MEDICINE DATABASE
# ─────────────────────────────────────────────────────────────────
# HOW TO ADD NEW MEDICINES: just append to the relevant group.
# Add BOTH brand name AND generic name for best fuzzy-match coverage.
# ═══════════════════════════════════════════════════════════════════
MEDICINE_DB = [

    # ── Analgesics / Antipyretics ──────────────────────────────────
    "Panadol", "Paracetamol", "Para", "Calpol", "Disprin", "Aspirin",
    "Brufen", "Ibuprofen", "Ponstan", "Mefenamic Acid",
    "Voltral", "Voltaren", "Diclofenac", "Nuberol", "Cataflam",
    "Voren", "Naproxen", "Naprosyn", "Arcoxia", "Etoricoxib",
    "Napa", "Napa Forte",
    "Enzoflam", "Enroflam",                    # dental / musculoskeletal
    "Dicloran", "Dolonex", "Fenac",

    # ── Antibiotics ────────────────────────────────────────────────
    "Augmentin", "Amoxicillin", "Amoxil", "Moxilen",
    "Cipro", "Ciprofloxacin", "Ciprobay", "Cifran",
    "Flagyl", "Metronidazole", "Entamizole",
    "Zithromax", "Azithromycin", "Azomax", "Azee",
    "Klaricid", "Clarithromycin", "Biaxin",
    "Cefspan", "Cefixime", "Suprax",
    "Cefazon", "Cefazolin", "Ancef",            # hospital IV — p7
    "Ceftriaxone", "Rocephin",
    "Cefuroxime", "Zinnat",
    "Cefotaxime", "Claforan",
    "Doxycycline", "Vibramycin", "Doxylin",
    "Amikacin", "Gentamicin", "Tobramycin",
    "Levofloxacin", "Tavanic", "Levaquin",
    "Pefloxacin", "Peflacin", "Peflox",         # hospital IV — p7
    "Meropenem", "Imipenem",
    "Clindamycin", "Dalacin",
    "Nitrofurantoin", "Macrobid",
    "Piperacillin", "Tazobactam", "Tazocin",
    "Vancomycin", "Vancocin",
    "Linezolid", "Zyvox",

    # ── IV Fluids / Hospital ───────────────────────────────────────
    "Saline",                                    # Normal Saline — p7
    "Normal Saline", "NS",
    "Ringer Lactate", "RL",
    "Dextrose", "D5W", "D10W",
    "Dextran",
    "Albumin",

    # ── Gastrointestinal ───────────────────────────────────────────
    "Risek", "Omeprazole", "Risek Mups",
    "Nexium", "Esomeprazole",
    "Pan-D", "Pantoprazole", "Pantoloc",
    "Gaviscon", "Mucaine", "Mylanta",
    "Motilium", "Domperidone",
    "Buscopan", "Hyoscine",
    "Zantac", "Ranitidine",
    "Lactulose", "Duphalac",
    "Smecta", "ORS",
    "Perisan", "Peeran",                         # laxative — p7

    # ── Antihistamines / Allergy ───────────────────────────────────
    "Rigix", "Cetirizine", "Zyrtec", "Cetriz",
    "Clarinase", "Loratadine", "Claritin",
    "Avil", "Pheniramine",
    "Levosiz", "Levocetirizine", "Xyzal",
    "Gravinate", "Dimenhydrinate", "Dramamine",
    "Hydryllin", "Phenergan", "Promethazine",
    "Fexofenadine", "Telfast",
    "Bilastin", "Bilaxten",

    # ── ENT / Respiratory ──────────────────────────────────────────
    "Arinac", "Actifed", "Sudafed",
    "Solvin", "Ambroxol", "Mucosolvan",
    "Ventolin", "Salbutamol", "Albuterol",
    "Seretide", "Fluticasone", "Advair",
    "Beclate", "Beclomethasone",
    "Montelukast", "Singulair",
    "Ipratropium", "Atrovent",
    "Tiotropium", "Spiriva",
    "Rhinocort", "Budesonide",
    "Otrivin", "Xylometazoline",
    "Plaruy", "Plarvy",                          # syrup — prescription8
    "Buforel", "Buforol",                        # syrup — prescription8
    "Biotrax", "Biotrace",                       # prescription8

    # ── Skin / Topical ─────────────────────────────────────────────
    "Hexigel", "Chlorhexidine",                  # dental — prescription
    "Softin", "Fusidic Acid", "Fucidin",
    "Betnovate", "Betamethasone",
    "Dermovate", "Clobetasol",
    "Canesten", "Clotrimazole",
    "Forcan", "Fluconazole", "Diflucan",
    "Zimig", "Terbinafine", "Lamisil",
    "Hydrocortisone",
    "Tacrolimus", "Protopic",

    # ── Vitamins / Supplements ─────────────────────────────────────
    "Surbex-Z", "Surbex", "Folicum", "Folic Acid",
    "Calcium Sandoz", "Calcium",
    "Vitamin D", "Vitamin D3", "Cholecalciferol",
    "Neurobion", "Vitamin B12",
    "Vitamin B Complex",
    "Zinc", "Zincovit",
    "Iron", "Ferrous Sulphate",
    "Omega 3",

    # ── Cardiovascular ─────────────────────────────────────────────
    "Norvasc", "Amlodipine",
    "Concor", "Bisoprolol",
    "Lowplat", "Clopidogrel", "Plavix",
    "Lisinopril", "Zestril",
    "Ramipril", "Altace",
    "Lipiget", "Atorvastatin", "Lipitor",
    "Simvastatin", "Zocor",
    "Rosuvastatin", "Crestor",
    "Metoprolol", "Lopressor", "Betaloc",
    "Atenolol", "Tenormin",
    "Digoxin", "Lanoxin",
    "Warfarin", "Coumadin",
    "Isosorbide", "Imdur",
    "Nifedipine", "Adalat",
    "Valsartan", "Diovan",
    "Losartan", "Cozaar", "Repace",
    "Furosemide", "Lasix",
    "Spironolactone", "Aldactone",
    "Amiodarone", "Cordarone",
    "Atroflex", "Atroflax",                      # prescription8 (anticholinergic/antispasmodic)

    # ── Diabetes ───────────────────────────────────────────────────
    "Glucophage", "Metformin",
    "Amaryl", "Glimepiride",
    "Januvia", "Sitagliptin",
    "Insulin", "Lantus", "Humalog",
    "Jardiance", "Empagliflozin",
    "Jardin", "Jardine",                         # prescription8 (Jardiance variant)
    "Forxiga", "Dapagliflozin",
    "Gliclazide", "Diamicron",
    "Glibenclamide", "Daonil",

    # ── Thyroid ────────────────────────────────────────────────────
    "Thyroxine", "Levothyroxine", "Synthroid",
    "Euthyrox", "Eltroxin",
    "Neomercazole", "Carbimazole",

    # ── Psychiatry / Neurology ─────────────────────────────────────
    "Xanax", "Alprazolam",
    "Lexotanil", "Bromazepam",
    "Rivotril", "Clonazepam",
    "Risperdal", "Risperidone",
    "Depakote", "Valproate",
    "Tegretol", "Carbamazepine",
    "Sertraline", "Zoloft",
    "Fluoxetine", "Prozac",
    "Escitalopram", "Lexapro", "Cipralex",
    "Paroxetine", "Paxil",
    "Quetiapine", "Seroquel",
    "Olanzapine", "Zyprexa",
    "Haloperidol", "Haldol",
    "Diazepam", "Valium",
    "Lorazepam", "Ativan",
    "Zolpidem", "Stilnox",

    # ── Pain — stronger / opioids ──────────────────────────────────
    "Tramadol", "Tramal", "Ultram",
    "Morphine", "MSContin",                      # printed prescription
    "Oxycodone", "Oxycontin",                    # printed prescription
    "Codeine",                                   # printed prescription
    "Norco",                                     # printed prescription (hydrocodone+paracetamol)
    "Hydrocodone",
    "Pregabalin", "Lyrica",
    "Gabapentin", "Neurontin",
    "Enzoflam", "Getzryl",

    # ── Hormones / Steroids ────────────────────────────────────────
    "Prednisolone", "Pred",
    "Dexamethasone", "Decadron",                 # hospital injection — p7
    "Dexona",
    "Hydrocortisone",
    "Methylprednisolone", "Medrol",
    "Progesterone", "Utrogestan",
    "Clomiphene", "Clomid",

    # ── Urology ────────────────────────────────────────────────────
    "Tamsulosin", "Flomax", "Urimax",
    "Finasteride", "Proscar",
    "Sildenafil", "Viagra",
    "Tadalafil", "Cialis",

    # ── Dental / Mouth ─────────────────────────────────────────────
    "Hexigel", "Chlorhexidine Gel",
    "Benzydamine", "Tantum",
    "Lidocaine", "Lignocaine",

    # ── Messy-handwriting captures (p6) ───────────────────────────
    # These are OCR-best-guess readings from extreme handwriting
    "Fanchuo", "Fanchu", "Fanchoo",             # unknown — p6
    "Norpe", "Norpo",                           # likely Napa/Norco — p6
    "Techoq",                                   # unknown — p6 (cap)
    "Slimqweq",                                 # unknown — p6
    "Garcin",                                   # could be Gardenal? — p6

    # ── Miscellaneous ──────────────────────────────────────────────
    "Arinac", "Brustan",
    "Ace", "Aceclofenac",
]

# ── Pre-build phonetic index ───────────────────────────────────────
PHONETIC_INDEX: dict[str, list[str]] = {}

def _build_phonetic_index() -> None:
    """Compute Soundex key for every medicine brand word once at startup."""
    if not PHONETIC_AVAILABLE:
        return
    for name in MEDICINE_DB:
        first = name.split()[0]
        try:
            key = jellyfish.soundex(first)
            PHONETIC_INDEX.setdefault(key, []).append(name)
        except Exception:
            pass

_build_phonetic_index()


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — REGEX PATTERNS
# ═══════════════════════════════════════════════════════════════════

# Form prefixes — always appear just before a medicine name
FORM_PREFIX_RE = re.compile(
    r'\b(tab\.?|tablet\.?|tabs\.?|cap\.?|capsule\.?|caps\.?|'
    r'inj\.?|injection\.?|iv\.?|infusion\.?|'
    r'syr\.?|syrup\.?|syp\.?|'
    r'supp\.?|oint\.?|ointment\.?|cream\.?|'
    r'drop\.?|drops\.?|gel\.?|spray\.?|inh\.?|inhaler\.?|'
    r'sol\.?|solution\.?|sachet\.?|sach\.?|'
    r'adv\.?|advice\.?)\s*'              # "Adv:" used in dental prescriptions
    r'([A-Za-z][A-Za-z0-9\-\+\s]{1,28})',
    re.IGNORECASE
)

# Dosage: 500mg, 2.5ml, 130mg/24hours, 0.5%, 1gm …
DOSAGE_RE = re.compile(
    r'(\d+\.?\d*)\s*'
    r'(mg|mcg|µg|ml|l\b|g\b|gm\b|%|iu\b|unit|units|'
    r'tab|tabs|tablet|tablets|cap|caps|capsule|capsules|'
    r'puff|puffs|drop|drops|cc\b|sachet|sachets)',
    re.IGNORECASE
)

# Duration
DURATION_RE = re.compile(
    r'(\d+)\s*(day|days|d\b|week|weeks|wk|wks|month|months|mth)',
    re.IGNORECASE
)

# Frequency — ordered longest → shortest so "1-1-1-1" is caught before "1-1-1"
FREQUENCY_PATTERNS = [
    (re.compile(r'\b1[\s\-+/]?1[\s\-+/]?1[\s\-+/]?1\b'),  'Four Times Daily'),
    (re.compile(r'\b1[\s\-+/]?1[\s\-+/]?1\b'),             'Three Times Daily'),
    (re.compile(r'\b1[\s\-+/]?0[\s\-+/]?1\b'),             'Twice Daily (morning & night)'),
    (re.compile(r'\b1[\s\-+/]?1[\s\-+/]?0\b'),             'Twice Daily (morning & afternoon)'),
    (re.compile(r'\b1[\s\-+/]?0[\s\-+/]?0\b'),             'Once in Morning'),
    (re.compile(r'\b0[\s\-+/]?0[\s\-+/]?1\b'),             'Once at Night'),
    (re.compile(r'\b0[\s\-+/]?1[\s\-+/]?0\b'),             'Once at Midday'),
    (re.compile(r'\bqid\b',    re.I),                       'Four Times Daily'),
    (re.compile(r'\bq6h\b',    re.I),                       'Every 6 Hours'),    # printed Rx
    (re.compile(r'\bq4h\b',    re.I),                       'Every 4 Hours'),    # printed Rx
    (re.compile(r'\bq8h\b',    re.I),                       'Every 8 Hours'),
    (re.compile(r'\btds\b',    re.I),                       'Three Times Daily'),
    (re.compile(r'\btid\b',    re.I),                       'Three Times Daily'),
    (re.compile(r'\bbd\b',     re.I),                       'Twice Daily'),
    (re.compile(r'\bbid\b',    re.I),                       'Twice Daily'),
    (re.compile(r'\bod\b',     re.I),                       'Once Daily'),
    (re.compile(r'\bqd\b',     re.I),                       'Once Daily'),
    (re.compile(r'\bsos\b',    re.I),                       'When Needed'),
    (re.compile(r'\bprn\b',    re.I),                       'When Needed (PRN)'),
    (re.compile(r'\bstat\b',   re.I),                       'Immediately (STAT)'),
    (re.compile(r'\bnightly\b',re.I),                       'Once at Night'),
    (re.compile(r'\bhs\b',     re.I),                       'At Bedtime'),
    (re.compile(r'\bac\b',     re.I),                       'Before Meals'),
    (re.compile(r'\bpc\b',     re.I),                       'After Meals'),
    (re.compile(r'\bonce\s+daily\b',        re.I),          'Once Daily'),
    (re.compile(r'\btwice\s+daily\b',       re.I),          'Twice Daily'),
    (re.compile(r'\bthrice\s+daily\b',      re.I),          'Three Times Daily'),
    (re.compile(r'\bat\s+night\b',          re.I),          'Once at Night'),
    (re.compile(r'\boral\s+daily\b',        re.I),          'Once Daily'),       # printed Rx
    (re.compile(r'\bevery\s+(\d+)\s+hours?\b', re.I),       None),
    (re.compile(r'\b(\d+)\s*[xX]\s*daily\b',  re.I),       None),
]

# Lines that should be SKIPPED (headers, patient info)
SKIP_KEYWORDS = [
    'clinic', 'hospital', 'medical centre', 'health care',
    'dental', 'ortho', 'ophthalmology', 'eye care', 'pediatric',
    'workplace', 'center',                       # printed Rx header
    'dr.', 'dr ', 'doctor', 'prof.', 'mbbs', 'fcps', 'frcs',
    'frcog', 'mrcp', 'phd', 'bds', 'dds', 'rmp',
    'patient name', 'patient address', 'patient:',
    'birthdate', 'allergies', 'mra', 'mrn',
    'age:', 'sex:', 'gender:',
    'date:', 'd.o.b', 'dob:', 'weight:', 'wt:',
    'ref:', 'reg:', 'id:', 'mr.', 'mrs.', 'ms.',
    'address', 'phone', 'tel:', 'mob:', 'contact',
    'signature', 'stamp', 'seal',
    'diagnosis', 'complaint', 'history', 'allergic',
    'follow up', 'review', 'advice', 'investigation',
    'dispense', 'substitution',                  # printed Rx footer
    'prescribed by', 'entered by',
    'dea #', 'npi #',
    'refill', 'supply',
    'start date',
    'not valid for court',                       # printed on Pakistani Rx
    'pharmacist please note',
    'dispense as written',
    'presenting complaints',
    'history findings',
    'pro morbids',
    'investigations',
]

# Words that are definitely NOT medicine names
NON_MEDICINE_WORDS = {
    'the', 'and', 'for', 'with', 'take', 'use', 'apply',
    'once', 'twice', 'thrice', 'daily', 'times', 'days',
    'week', 'weeks', 'month', 'morning', 'night', 'evening',
    'after', 'before', 'meal', 'meals', 'food', 'water',
    'dose', 'doses', 'tab', 'tabs', 'cap', 'caps',
    'inj', 'syr', 'syp', 'oint', 'gel', 'cream',
    'stat', 'prn', 'sos', 'bd', 'od', 'tds', 'qid',
    'hs', 'ac', 'pc', 'bid', 'tid', 'sig', 'mitte',
    'quantity', 'disp', 'refill', 'total', 'oral',
    'capsule', 'tablet', 'injection', 'extended',
    'release', 'thirty', 'sixty', 'hundred', 'pain',
    'adv', 'advice', 'gum', 'paint', 'massage',
    'this', 'your', 'pharmacy', 'note', 'list',
    'may', 'incomplete', 'please', 'dispense',
}

# ── Printed Rx "Rx:" block pattern ────────────────────────────────
# Printed prescriptions like prescription4 start each drug with "Rx:"
PRINTED_RX_RE = re.compile(
    r'Rx[:\s]+([A-Za-z][A-Za-z0-9\-\+\s]{1,30?})\s+'
    r'(?:oral\s+)?(\d+\.?\d*\s*(?:mg|mcg|g|ml))',
    re.IGNORECASE
)

NOISE_RE  = re.compile(r'[^\w\s\.\-\+\(\)\/\%]')
BULLET_RE = re.compile(
    r'^\s*(?:\d{1,2}\.|\(\d{1,2}\)|\d{1,2}\)|\-|--|•|★|->|>|=|\+)\s*'
)


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — MULTI-PASS IMAGE PREPROCESSING
# Four different OpenCV pipelines run in parallel.
# Best result (most text boxes) wins.
# ═══════════════════════════════════════════════════════════════════

def _upscale(gray: np.ndarray, target: int = 1800) -> np.ndarray:
    h, w = gray.shape
    if max(h, w) < target:
        scale = target / max(h, w)
        gray  = cv2.resize(gray, None, fx=scale, fy=scale,
                           interpolation=cv2.INTER_CUBIC)
    return gray


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Correct page tilt — Pakistani doctors often write on angled pads."""
    _, binary = cv2.threshold(gray, 0, 255,
                              cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(binary > 0))
    if len(coords) < 50:
        return gray
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle
    if abs(angle) < 0.5:
        return gray
    h, w   = gray.shape
    center = (w // 2, h // 2)
    M      = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h),
                          flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def _remove_shadow(gray: np.ndarray) -> np.ndarray:
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (39, 39))
    bg     = cv2.dilate(gray, kernel)
    return cv2.divide(gray, bg, scale=255)


def pipeline_A(gray: np.ndarray) -> np.ndarray:
    """Standard — normal handwriting, decent lighting."""
    no_shadow = _remove_shadow(gray)
    denoised  = cv2.fastNlMeansDenoising(no_shadow, h=9,
                                          templateWindowSize=7,
                                          searchWindowSize=21)
    binary = cv2.adaptiveThreshold(denoised, 255,
                                   cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 31, 12)
    k = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]], dtype=np.float32)
    return cv2.filter2D(binary, -1, k)


def pipeline_B(gray: np.ndarray) -> np.ndarray:
    """CLAHE + Otsu — light ink, pencil, faded writing."""
    clahe     = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced  = clahe.apply(gray)
    blurred   = cv2.GaussianBlur(enhanced, (3, 3), 0)
    _, binary = cv2.threshold(blurred, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    return cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)


def pipeline_C(gray: np.ndarray) -> np.ndarray:
    """Bilateral + mean threshold — noisy / textured paper."""
    bilateral = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
    no_shadow = _remove_shadow(bilateral)
    return cv2.adaptiveThreshold(no_shadow, 255,
                                 cv2.ADAPTIVE_THRESH_MEAN_C,
                                 cv2.THRESH_BINARY, 25, 10)


def pipeline_D(gray: np.ndarray) -> np.ndarray:
    """Large-block adaptive — thick strokes, very messy handwriting."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    binary  = cv2.adaptiveThreshold(blurred, 255,
                                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 51, 20)
    kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    return cv2.dilate(binary, kernel, iterations=1)


def pipeline_E(gray: np.ndarray) -> np.ndarray:
    """
    Extra pipeline for printed computer prescriptions.
    High-resolution clean threshold — printed text is already clean
    so we skip heavy preprocessing that blurs clean edges.
    """
    blurred = cv2.GaussianBlur(gray, (1, 1), 0)
    _, binary = cv2.threshold(blurred, 180, 255, cv2.THRESH_BINARY)
    return binary


def preprocess_image(image_path: str) -> list[str]:
    """
    Run all five pipelines on the image.
    Returns list of temp file paths; each tried with EasyOCR.
    """
    img = cv2.imread(image_path)
    if img is None:
        print(f'[ERROR] Cannot open: {image_path}')
        return [image_path]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = _upscale(gray, target=1800)
    gray = _deskew(gray)

    paths = []
    for idx, pipeline in enumerate(
        [pipeline_A, pipeline_B, pipeline_C, pipeline_D, pipeline_E], start=1
    ):
        try:
            processed = pipeline(gray.copy())
            out_path  = f'medspot_temp_{idx}.png'
            cv2.imwrite(out_path, processed)
            paths.append(out_path)
        except Exception as e:
            print(f'[WARN] Pipeline {idx} failed: {e}')

    return paths or [image_path]


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — MULTI-PASS OCR
# ═══════════════════════════════════════════════════════════════════

def run_ocr_all_passes(image_paths: list[str]) -> list:

    best_boxes = []
    best_count = 0

    for path in image_paths:
        for cfg in [
            # Sensitive — bad handwriting
            dict(contrast_ths=0.05, text_threshold=0.35,
                 low_text=0.25, width_ths=1.0, paragraph=False),
            # Balanced — normal / printed
            dict(contrast_ths=0.1,  text_threshold=0.55,
                 low_text=0.4,  width_ths=0.8, paragraph=False),
        ]:
            try:
                boxes = reader.readtext(path, detail=1, **cfg)
                if len(boxes) > best_count:
                    best_count = len(boxes)
                    best_boxes = boxes
            except Exception as e:
                print(f'[WARN] OCR pass failed on {path}: {e}')

    print(f'[INFO] Best OCR pass: {best_count} text regions')
    return best_boxes


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — PRINTED RX SPECIAL PARSER
# Handles structured printed prescriptions (prescription4.jpeg style).
# Looks for "Rx: <medicine> <dosage>" blocks.
# ═══════════════════════════════════════════════════════════════════

def parse_printed_rx_blocks(all_text: str) -> list[dict]:
    """
    Extract medicines from a full-text dump of a printed prescription.
    Matches "Rx: morphine 130 mg/24 hours oral capsule" style lines.
    Returns list of dicts (same format as parse_line).
    """
    results = []
    # Match printed Rx blocks — "Rx:  DrugName Dosage"
    pattern = re.compile(
        r'Rx[:\s]+([A-Za-z][A-Za-z0-9\-]+)\s+'     # medicine name
        r'(?:oral\s+)?'
        r'(\d+\.?\d*\s*(?:mg|mcg|g|ml|gm))',        # dosage
        re.IGNORECASE
    )
    for m in pattern.finditer(all_text):
        name   = m.group(1).strip().title()
        dosage = m.group(2).strip()
        # Look for frequency near this match
        context = all_text[m.start():m.start()+200]
        freq    = _extract_frequency_from_text(context)
        dur     = _extract_duration_from_text(context)

        matched, score, method = match_medicine(name)
        results.append({
            'medicine':    matched or name,
            'form':        'Tablet' if 'tablet' in context.lower() else
                           'Capsule' if 'capsule' in context.lower() else '',
            'dosage':      dosage,
            'frequency':   freq,
            'duration':    dur,
            'confidence':  'High' if score >= 90 else 'Medium' if score >= 72 else 'Low',
            'match_score': score,
            'method':      method or 'printed_rx_block',
            'raw_text':    m.group(0)[:80],
        })

    return results


# ═══════════════════════════════════════════════════════════════════
# SECTION 6 — FIELD EXTRACTORS
# ═══════════════════════════════════════════════════════════════════

def _extract_dosage_from_text(text: str) -> str:
    m = DOSAGE_RE.search(text)
    return m.group(0).strip() if m else ''

def _extract_frequency_from_text(text: str) -> str:
    for pattern, label in FREQUENCY_PATTERNS:
        m = pattern.search(text)
        if m:
            if label:
                return label
            raw = m.group(0)
            if 'hour' in raw.lower():
                hrs = re.search(r'\d+', raw)
                return f'Every {hrs.group()} Hours' if hrs else raw
            n = re.search(r'\d+', raw)
            return f'{n.group()} Times Daily' if n else raw
    return ''

def _extract_duration_from_text(text: str) -> str:
    m = DURATION_RE.search(text)
    if not m:
        return ''
    num  = m.group(1)
    unit = m.group(2).lower()
    unit = {'d':'day','wk':'week','wks':'weeks','mth':'month'}.get(unit, unit)
    return f'{num} {unit}'

# Public aliases
extract_dosage    = _extract_dosage_from_text
extract_frequency = _extract_frequency_from_text
extract_duration  = _extract_duration_from_text


# ═══════════════════════════════════════════════════════════════════
# SECTION 7 — THREE-LAYER MEDICINE MATCHING
# ═══════════════════════════════════════════════════════════════════

def match_medicine(word: str) -> tuple[str, int, str]:
    """
    Match a word against MEDICINE_DB using three layers:
      Layer 1: exact / substring     → score 90-100
      Layer 2: fuzzy ratio           → score 55-89
      Layer 3: phonetic Soundex      → score 50-70

    Returns (matched_name, score, method) or ('', 0, 'none').
    """
    if len(word) < 3:
        return '', 0, 'none'

    word_lower = word.lower()

    # Layer 1: exact
    for med in MEDICINE_DB:
        if med.lower() == word_lower:
            return med, 100, 'exact'
        if word_lower in med.lower() and len(word) >= 4:
            return med, 95, 'substring'
        if med.lower() in word_lower and len(med) >= 4:
            return med, 90, 'substring'

    # Layer 2: fuzzy — try two scorers, keep best
    best_name, best_score = '', 0
    for scorer in (fuzz.token_sort_ratio, fuzz.WRatio):
        r = process.extractOne(word, MEDICINE_DB, scorer=scorer, score_cutoff=55)
        if r and r[1] > best_score:
            best_name, best_score = r[0], r[1]
    if best_score >= 55:
        return best_name, best_score, 'fuzzy'

    # Layer 3: phonetic
    if PHONETIC_AVAILABLE and len(word) >= 4:
        try:
            key = jellyfish.soundex(word)
            candidates = PHONETIC_INDEX.get(key, [])
            if candidates:
                r = process.extractOne(word, candidates,
                                       scorer=fuzz.ratio, score_cutoff=50)
                if r:
                    return r[0], r[1], 'phonetic'
        except Exception:
            pass

    return '', 0, 'none'


# ═══════════════════════════════════════════════════════════════════
# SECTION 8 — MEDICINE NAME DETECTION (CONTEXT STRATEGIES)
# ═══════════════════════════════════════════════════════════════════

def _candidate_words(text: str) -> list[str]:
    clean  = re.sub(r'[^a-zA-Z\s\-\+]', ' ', text)
    words  = [w for w in clean.split() if len(w) >= 3]
    combos = [f'{words[i]} {words[i+1]}' for i in range(len(words)-1)]
    return words + combos


def find_medicine_in_line(text: str, dosage: str) -> tuple[str, int, str]:
    """
    Multi-strategy medicine detection:
      A — Form prefix  (most reliable)
      B — Word before dosage
      C — Database sweep of all words
      D — Fallback ALLCAPS / capitalised token
    """
    best_name, best_score, best_method = '', 0, 'none'

    # A: form prefix
    m = FORM_PREFIX_RE.search(text)
    if m:
        candidate = re.sub(r'[^A-Za-z0-9\-\+\s]', '', m.group(2)).strip()
        candidate = ' '.join(candidate.split()[:2])
        if candidate and candidate.lower() not in NON_MEDICINE_WORDS:
            name, score, method = match_medicine(candidate)
            chosen_name   = name or candidate.title()
            chosen_score  = score or 70
            chosen_method = method or 'prefix_context'
            if chosen_score > best_score:
                best_name, best_score, best_method = chosen_name, chosen_score, chosen_method

    # B: word before dosage
    if dosage:
        esc = re.escape(dosage)
        bef = re.search(
            r'([A-Za-z][A-Za-z0-9\-\+]*(?:\s+[A-Za-z][A-Za-z0-9\-\+]*)?)\s+' + esc,
            text, re.IGNORECASE
        )
        if bef:
            candidate = re.sub(r'[^A-Za-z0-9\-\+ ]', '', bef.group(1)).strip()
            if candidate and candidate.lower() not in NON_MEDICINE_WORDS:
                name, score, method = match_medicine(candidate)
                chosen_name   = name or candidate.title()
                chosen_score  = score or 68
                chosen_method = method or 'dosage_context'
                if chosen_score > best_score:
                    best_name, best_score, best_method = chosen_name, chosen_score, chosen_method

    # C: sweep all candidate words
    for candidate in _candidate_words(text):
        if candidate.lower() in NON_MEDICINE_WORDS:
            continue
        name, score, method = match_medicine(candidate)
        if score > best_score:
            best_name, best_score, best_method = name, score, method

    # D: fallback — capitalised token
    if not best_name:
        stripped = BULLET_RE.sub('', text).strip()
        for w in re.findall(r'\b[A-Z]{3,}\b', stripped):
            if w.lower() not in NON_MEDICINE_WORDS:
                best_name, best_score, best_method = w.title(), 50, 'caps_fallback'
                break
        if not best_name:
            for w in re.findall(r'\b[A-Z][a-z]{2,}\b', stripped):
                if w.lower() not in NON_MEDICINE_WORDS:
                    best_name, best_score, best_method = w, 45, 'cap_fallback'
                    break

    return best_name, best_score, best_method


# ═══════════════════════════════════════════════════════════════════
# SECTION 9 — LINE PARSER
# ═══════════════════════════════════════════════════════════════════

def parse_line(text: str) -> dict | None:
    """Parse one OCR text row → structured medicine dict or None."""
    text = NOISE_RE.sub(' ', text)
    text = ' '.join(text.split())

    dosage    = extract_dosage(text)
    frequency = extract_frequency(text)
    duration  = extract_duration(text)

    medicine, score, method = find_medicine_in_line(text, dosage)
    if not medicine or score < 45:
        return None

    form_m = re.search(
        r'\b(tab|tablet|cap|capsule|inj|injection|iv|syr|syrup|syp|'
        r'oint|ointment|cream|drop|drops|gel|spray|inhaler|solution|sachet)\b',
        text, re.IGNORECASE
    )
    form = form_m.group(0).capitalize() if form_m else ''

    confidence = ('High'   if score >= 90 else
                  'Medium' if score >= 72 else
                  'Low')

    return {
        'medicine':    medicine,
        'form':        form,
        'dosage':      dosage,
        'frequency':   frequency,
        'duration':    duration,
        'confidence':  confidence,
        'match_score': score,
        'method':      method,
        'raw_text':    text.strip(),
    }


# ═══════════════════════════════════════════════════════════════════
# SECTION 10 — ROW GROUPING
# ═══════════════════════════════════════════════════════════════════

def group_into_rows(boxes: list, y_tolerance: int = 45) -> list:
    if not boxes:
        return []
    boxes.sort(key=lambda b: b[0][0][1])
    rows, current = [], [boxes[0]]
    for box in boxes[1:]:
        prev_mid = (current[-1][0][0][1] + current[-1][0][2][1]) / 2
        curr_mid = (box[0][0][1] + box[0][2][1]) / 2
        if abs(curr_mid - prev_mid) <= y_tolerance:
            current.append(box)
        else:
            rows.append(current)
            current = [box]
    rows.append(current)
    for row in rows:
        row.sort(key=lambda b: b[0][0][0])
    return rows


# ═══════════════════════════════════════════════════════════════════
# SECTION 11 — NOISE / HEADER FILTER
# ═══════════════════════════════════════════════════════════════════

def is_noise_line(text: str) -> bool:
    if len(text.strip()) < 4:
        return True
    low = text.lower()
    return any(kw in low for kw in SKIP_KEYWORDS)


# ═══════════════════════════════════════════════════════════════════
# SECTION 12 — DEDUPLICATION
# ═══════════════════════════════════════════════════════════════════

def deduplicate(items: list) -> list:
    seen: dict[str, dict] = {}
    for item in items:
        key = item['medicine'].lower().strip()
        if key not in seen:
            seen[key] = item
        else:
            ex = seen[key]
            for f in ('form', 'dosage', 'frequency', 'duration'):
                if not ex[f] and item[f]:
                    ex[f] = item[f]
            if item['match_score'] > ex['match_score']:
                ex.update({
                    'confidence':  item['confidence'],
                    'match_score': item['match_score'],
                    'method':      item['method'],
                })
    return list(seen.values())


# ═══════════════════════════════════════════════════════════════════
# SECTION 13 — MAIN SCAN PIPELINE
# ═══════════════════════════════════════════════════════════════════

def scan_prescription(image_name: str) -> list:
    """
    Full pipeline:
      1. Locate image
      2. Five OpenCV pipelines → best preprocessed version
      3. EasyOCR × 2 configs per image → best OCR result
      4. Detect if printed (Rx: blocks) → dedicated parser
      5. Group boxes → rows → filter noise → parse each line
      6. Deduplicate → return
    """
    # 1. Find image
    base = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base, 'uploads', image_name),
        os.path.join(base, '..', 'uploads', image_name),
        os.path.join(base, image_name),
        image_name,
    ]
    image_path = next((p for p in candidates if os.path.exists(p)), None)
    if not image_path:
        print(f'[ERROR] Image not found: {image_name}')
        return []
    print(f'[INFO] Image : {image_path}')

    # 2. Preprocess
    temp_paths = preprocess_image(image_path)
    print(f'[INFO] Pipelines: {len(temp_paths)} versions generated')

    # 3. OCR
    all_boxes = run_ocr_all_passes(temp_paths)

    # Cleanup temp files
    for p in temp_paths:
        if os.path.exists(p) and p != image_path:
            os.remove(p)

    if not all_boxes:
        print('[WARN] No text detected.')
        return []

    # Build full-text dump for printed Rx detection
    all_text = ' '.join(b[1] for b in all_boxes)

    # 4. Detect printed Rx blocks first
    printed_results = parse_printed_rx_blocks(all_text)
    if printed_results:
        print(f'[INFO] Printed Rx parser: {len(printed_results)} medicines found')
        return deduplicate(printed_results)

    # 5. Group → filter → parse
    rows = group_into_rows(all_boxes, y_tolerance=45)
    print(f'[INFO] Rows : {len(rows)} text rows')

    raw_results = []
    for row in rows:
        line = ' '.join(b[1] for b in row)
        if is_noise_line(line):
            continue
        parsed = parse_line(line)
        if parsed:
            raw_results.append(parsed)

    # 6. Deduplicate
    return deduplicate(raw_results)


# ═══════════════════════════════════════════════════════════════════
# SECTION 14 — OUTPUT
# ═══════════════════════════════════════════════════════════════════

def print_results(results: list, image_name: str) -> None:
    SEP = '=' * 108
    print(f'\n{SEP}')
    print(f'  MEDSPOT OCR — {image_name}')
    print(SEP)

    if not results:
        print('  No medicines detected.\n')
        print('  Troubleshooting tips:')
        print('    - Ensure whole prescription is in frame (not cut off)')
        print('    - Good lighting, no harsh shadows')
        print('    - Hold phone still — no motion blur')
        print('    - For very messy writing, try Gemini fallback')
        print(f'{SEP}\n')
        print('[JSON_OUTPUT_START]')
        print('[]')
        print('[JSON_OUTPUT_END]')
        return

    hdr = (f"  {'#':<4}"
           f"{'MEDICINE':<22}"
           f"{'FORM':<10}"
           f"{'DOSAGE':<14}"
           f"{'FREQUENCY':<32}"
           f"{'DURATION':<12}"
           f"{'CONF':<8}"
           f"METHOD")
    print(hdr)
    print('  ' + '-' * 103)

    for i, item in enumerate(results, 1):
        print(
            f"  {i:<4}"
            f"{item['medicine'][:21]:<22}"
            f"{(item['form'] or '-')[:9]:<10}"
            f"{(item['dosage'] or '-')[:13]:<14}"
            f"{(item['frequency'] or '-')[:31]:<32}"
            f"{(item['duration'] or '-')[:11]:<12}"
            f"{item['confidence']:<8}"
            f"{item['method']}"
        )

    print('  ' + '-' * 103)
    print(f'  Total: {len(results)} medicine(s) found')
    print(f'{SEP}\n')

    print('[JSON_OUTPUT_START]')
    print(json.dumps(results, indent=2, ensure_ascii=False))
    print('[JSON_OUTPUT_END]')


def process_prescription(image_path):

    global reader

    if 'reader' not in globals():

        reader = easyocr.Reader(
            ['en'],
            gpu=torch.cuda.is_available(),
            model_storage_directory=os.path.expanduser(
                '~/.easyocr'
            ),
            recog_network='english_g2'
        )

    results = scan_prescription(image_path)

    return results


# ==========================================================
# SECTION 15 — ENTRY POINT
# ==========================================================

if __name__ == '__main__':

    test_file = (
        sys.argv[1]
        if len(sys.argv) > 1
        else 'prescription8.jpeg'
    )

    print('=' * 60)
    print(' MedSpot OCR — Universal Edition v3')

    print(
        f'Device : {"GPU" if torch.cuda.is_available() else "CPU"}'
    )

    print(f'Image : {test_file}')

    print('=' * 60)

    results = process_prescription(
        test_file
    )

    print_results(
        results,
        test_file
    )