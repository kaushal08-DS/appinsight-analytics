from pathlib import Path
import re
import pandas as pd
import numpy as np

REQUIRED_CATEGORIES = {
    'GAME','BEAUTY','BUSINESS','COMICS','COMMUNICATION','DATING','ENTERTAINMENT','SOCIAL','EVENTS'
}


def parse_number(value):
    if pd.isna(value): return np.nan
    s = str(value).strip().replace(',', '').replace('+','')
    m = re.search(r'-?\d+(?:\.\d+)?', s)
    return float(m.group()) if m else np.nan


def parse_size_mb(value):
    if pd.isna(value): return np.nan
    s = str(value).strip().upper()
    if s in {'', 'NAN', 'N/A', 'UNKNOWN', 'VARIES WITH DEVICE'}: return np.nan
    try:
        if s.endswith('GB'): return float(s[:-2]) * 1024
        if s.endswith('G'): return float(s[:-1]) * 1024
        if s.endswith('MB'): return float(s[:-2])
        if s.endswith('M'): return float(s[:-1])
        if s.endswith('KB'): return float(s[:-2]) / 1024
        if s.endswith('K'): return float(s[:-1]) / 1024
        return float(s)
    except ValueError:
        return np.nan


def clean_dataset(raw: pd.DataFrame):
    df = raw.copy()
    original_rows = len(df)
    exact_duplicates = int(df.duplicated().sum())
    df = df.drop_duplicates().copy()
    df['category_key'] = df['Category'].astype(str).str.strip().str.upper()
    df['rating_num'] = pd.to_numeric(df['Rating'], errors='coerce')
    df['reviews_num'] = df['Reviews'].map(parse_number)
    df['installs_num'] = df['Installs'].map(parse_number)
    df['size_mb'] = df['Size'].map(parse_size_mb)
    # Subjectivity is deliberately NOT fabricated. This dataset has no review-text or subjectivity column.
    subjectivity_col = next((c for c in df.columns if c.lower() in {'subjectivity','sentiment subjectivity','review subjectivity'}), None)
    if subjectivity_col:
        df['subjectivity_num'] = pd.to_numeric(df[subjectivity_col], errors='coerce')
    else:
        df['subjectivity_num'] = np.nan
    valid_rating = df['rating_num'].between(0,5) | df['rating_num'].isna()
    valid_reviews = df['reviews_num'].ge(0) | df['reviews_num'].isna()
    valid_installs = df['installs_num'].ge(0) | df['installs_num'].isna()
    invalid_values = int((~valid_rating | ~valid_reviews | ~valid_installs | (df['size_mb'] < 0)).sum())
    df = df[valid_rating & valid_reviews & valid_installs & (df['size_mb'].isna() | (df['size_mb'] >= 0))].copy()

    stages = [{'name':'Raw dataset','count':original_rows},
              {'name':'Remove exact duplicates','count':len(df)}]
    d = df[df['category_key'].isin(REQUIRED_CATEGORIES)].copy(); stages.append({'name':'Category filter','count':len(d)})
    d = d[d['rating_num'] > 3.5].copy(); stages.append({'name':'Rating > 3.5','count':len(d)})
    d = d[d['installs_num'] > 50000].copy(); stages.append({'name':'Installs > 50,000','count':len(d)})
    d = d[d['reviews_num'] > 500].copy(); stages.append({'name':'Reviews > 500','count':len(d)})
    d = d[d['size_mb'].between(10,100,inclusive='both')].copy(); stages.append({'name':'Size 10–100 MB','count':len(d)})
    subjectivity_available = bool(subjectivity_col)
    if subjectivity_available:
        d = d[d['subjectivity_num'] > 0.5].copy()
        stages.append({'name':'Subjectivity > 0.5','count':len(d)})
    else:
        stages.append({'name':'Subjectivity > 0.5 (blocked: unavailable)','count':None})
    d = d[~d['App'].astype(str).str.contains('s', case=False, na=False)].copy()
    stages.append({'name':'Remove S/s app names','count':len(d) if subjectivity_available else None})
    return df, d, {
        'original_rows': original_rows,
        'exact_duplicates': exact_duplicates,
        'invalid_values': invalid_values,
        'subjectivity_available': subjectivity_available,
        'subjectivity_column': subjectivity_col,
        'stages': stages,
    }


def load_and_prepare(path: str):
    raw = pd.read_csv(path)
    cleaned, eligible, meta = clean_dataset(raw)
    return raw, cleaned, eligible, meta
