import math
import pandas as pd
import numpy as np

# Flat-top hexbin aggregation, returning polygon geometry ready for the browser.
def hexbin(df, x_col='size_mb', y_col='rating_num', value_col='installs_num', x_bins=22, y_bins=16):
    d=df[[x_col,y_col,value_col]].dropna().copy()
    if d.empty: return []
    xmin,xmax=float(d[x_col].min()),float(d[x_col].max()); ymin,ymax=float(d[y_col].min()),float(d[y_col].max())
    if xmin==xmax: xmin-=.5; xmax+=.5
    if ymin==ymax: ymin-=.1; ymax+=.1
    dx=(xmax-xmin)/x_bins; dy=(ymax-ymin)/y_bins
    groups={}
    for _,r in d.iterrows():
        # offset alternating rows to create hex-like cells
        row=int(np.clip(math.floor((r[y_col]-ymin)/dy),0,y_bins-1))
        offset=.5 if row%2 else 0.0
        col=int(np.clip(math.floor((r[x_col]-xmin)/dx-offset),0,x_bins-1))
        key=(col,row)
        g=groups.setdefault(key, {'xs':[],'ys':[],'vals':[]})
        g['xs'].append(float(r[x_col])); g['ys'].append(float(r[y_col])); g['vals'].append(float(r[value_col]))
    out=[]
    rx=dx*.52; ry=dy*.52
    for (col,row),g in groups.items():
        cx=xmin+(col+(0.5 if row%2 else 0))*dx+dx/2
        cy=ymin+(row+.5)*dy
        poly=[]
        for k in range(6):
            a=math.pi/6 + k*math.pi/3
            poly.append([cx+rx*math.cos(a), cy+ry*math.sin(a)])
        out.append({'polygon':poly,'count':len(g['vals']),'avg_installs':float(np.mean(g['vals'])),'avg_rating':float(np.mean(g['ys'])),'avg_size':float(np.mean(g['xs']))})
    return out
