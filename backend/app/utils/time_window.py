from datetime import datetime, time
from zoneinfo import ZoneInfo
IST=ZoneInfo('Asia/Kolkata')
OPEN=time(17,0); CLOSE=time(19,0)

def now_ist(): return datetime.now(IST)
def is_open(dt=None):
    dt=dt or now_ist(); return OPEN <= dt.time() < CLOSE

def next_window(dt=None):
    dt=dt or now_ist()
    if is_open(dt): return 'Today, 5:00 PM IST – 7:00 PM IST'
    if dt.time() < OPEN: return 'Today, 5:00 PM IST – 7:00 PM IST'
    return 'Tomorrow, 5:00 PM IST – 7:00 PM IST'
