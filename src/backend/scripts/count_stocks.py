import json
from datetime import datetime, timedelta

data = json.load(open('app/data/nse500.json'))
total = len(data)

with_dates = [d for d in data if d.get('listing_date')]

cutoff_30 = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
cutoff_90 = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
cutoff_365 = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

recent_30 = [d for d in data if (d.get('listing_date') or '') >= cutoff_30]
recent_90 = [d for d in data if (d.get('listing_date') or '') >= cutoff_90]
recent_365 = [d for d in data if (d.get('listing_date') or '') >= cutoff_365]
historic = [d for d in data if (d.get('listing_date') or '') < '2000-01-01' and d.get('listing_date')]

print(f'STOCK UNIVERSE SUMMARY')
print(f'=' * 40)
print(f'Total stocks indexed (NSE):  {total:,}')
print(f'Stocks with listing dates:   {len(with_dates):,}')
print(f'')
print(f'RECENT LISTINGS')
print(f'-' * 40)
print(f'Listed in last 30 days:      {len(recent_30):,}')
print(f'Listed in last 90 days:      {len(recent_90):,}')
print(f'Listed in last 1 year:       {len(recent_365):,}')
print(f'Historic stocks (pre-2000):  {len(historic):,}')
print(f'')
print(f'MOST RECENT 10 LISTINGS')
print(f'-' * 40)
recent_sorted = sorted([d for d in data if d.get('listing_date')], key=lambda x: x['listing_date'], reverse=True)
for s in recent_sorted[:10]:
    ticker = s['ticker']
    name = s['name'][:42]
    date = s['listing_date']
    print(f"  {ticker:20} {name:42} {date}")
