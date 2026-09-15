"""Script to explore NSE listing dates"""
import httpx, csv, io
headers = {'User-Agent': 'Mozilla/5.0'}
r = httpx.get('https://archives.nseindia.com/content/equities/EQUITY_L.csv', headers=headers)
reader = csv.DictReader(io.StringIO(r.text.strip()))
rows = list(reader)
from datetime import datetime
def parse_date(d):
    try:
        return datetime.strptime(d.strip(), '%d-%b-%Y')
    except:
        return datetime.min
rows.sort(key=lambda x: parse_date(x.get(' DATE OF LISTING', '')), reverse=True)
print('Most recently listed companies:')
for row in rows[:15]:
    print(f"  {row['SYMBOL'].strip()} | {row['NAME OF COMPANY'].strip()} | Listed: {row[' DATE OF LISTING'].strip()}")
