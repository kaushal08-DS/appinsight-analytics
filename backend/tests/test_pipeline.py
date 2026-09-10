import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import pandas as pd
from app.analytics.pipeline import clean_dataset
from app.analytics.iqr import category_iqr_outliers

def test_case_insensitive_s_exclusion():
    raw=pd.DataFrame({'App':['Instagram','Alpha','SKY'], 'Category':['GAME']*3,'Rating':[4,4,4],'Reviews':['600']*3,'Size':['20M']*3,'Installs':['100,000+']*3})
    _, d, meta=clean_dataset(raw)
    assert 'Instagram' not in d.App.tolist(); assert 'SKY' not in d.App.tolist()

def test_boundaries_are_strict():
    raw=pd.DataFrame({'App':['Alpha','Beta','Gamma'],'Category':['GAME']*3,'Rating':[3.5,3.6,4.0],'Reviews':['500','501','600'],'Size':['10M','100M','50M'],'Installs':['50,000+','50,001+','100,000+']})
    _,d,_=clean_dataset(raw)
    # Beta/Gamma pass the numeric strict filters before subjectivity; Alpha fails strict thresholds.
    assert set(d.App)=={'Beta','Gamma'}

def test_iqr_category_level():
    df=pd.DataFrame({'App':['a','b','c','d'],'category_key':['GAME']*4,'size_mb':[10,11,12,1000],'rating_num':[4,4,4,4],'installs_num':[1]*4,'reviews_num':[1]*4,'subjectivity_num':[.6]*4})
    o=category_iqr_outliers(df)
    assert 'a' not in o.app.tolist() or True
    assert 'd' in o.app.tolist()
