-- Supabase PostgreSQL Schema for VRIDDHI (TRD §4)

create extension if not exists "pgcrypto";

create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,               -- e.g. 'RELIANCE.NS'
  company_name text,
  added_at timestamptz default now(),
  unique(user_id, ticker)
);

create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker text not null,
  quantity numeric not null check (quantity > 0),
  avg_buy_price numeric not null check (avg_buy_price > 0),
  added_at timestamptz default now(),
  unique(user_id, ticker)
);

create table if not exists stock_fundamentals (
  ticker text primary key,            -- 'RELIANCE.NS'
  payload jsonb not null,             -- raw merged yfinance + screener data
  fetched_at timestamptz default now()
);

create table if not exists analysis_reports (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  score_total int not null check (score_total between 0 and 100),
  rating_band text not null,          -- Excellent/Good/Average/Weak/Poor
  layers jsonb not null,              -- {L1:{score,max,confidence,details},...}
  checklist jsonb not null,           -- [{metric,value,verdict:pass|warn|fail,explanation}]
  red_flags jsonb not null default '[]',
  ai_summary text,
  sources jsonb not null default '[]',-- [{name,url,used_for}]
  model_meta jsonb,                   -- {llm:"gemini-2.0-flash", version:"1.0"}
  created_at timestamptz default now(),
  expires_at timestamptz not null     -- created_at + 24h
);
create index if not exists idx_analysis_reports_ticker_expires on analysis_reports (ticker, expires_at);

create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  title text not null,
  url text not null,
  source text,
  published_at timestamptz,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  fetched_at timestamptz default now(),
  unique(ticker, url)
);
create index if not exists idx_news_items_ticker_pub on news_items (ticker, published_at desc);

create table if not exists filings_log (
  id uuid primary key default gen_random_uuid(),
  ticker text,
  filing_type text,                   -- result|announcement|annual_report|concall
  title text,
  url text not null,
  processed boolean default false,
  fetched_at timestamptz default now(),
  unique(url)
);

-- Enable RLS
alter table watchlists enable row level security;
alter table portfolios enable row level security;
alter table stock_fundamentals enable row level security;
alter table analysis_reports enable row level security;
alter table news_items enable row level security;
alter table filings_log enable row level security;

-- Policies for user-specific tables
create policy "Users can view own watchlist" on watchlists for select using (auth.uid() = user_id);
create policy "Users can insert own watchlist" on watchlists for insert with check (auth.uid() = user_id);
create policy "Users can delete own watchlist" on watchlists for delete using (auth.uid() = user_id);

create policy "Users can view own portfolio" on portfolios for select using (auth.uid() = user_id);
create policy "Users can insert own portfolio" on portfolios for insert with check (auth.uid() = user_id);
create policy "Users can update own portfolio" on portfolios for update using (auth.uid() = user_id);
create policy "Users can delete own portfolio" on portfolios for delete using (auth.uid() = user_id);

-- Policies for public / read-only tables (authenticated users can read, service role can write)
create policy "Authenticated users can read stock_fundamentals" on stock_fundamentals for select to authenticated using (true);
create policy "Authenticated users can read analysis_reports" on analysis_reports for select to authenticated using (true);
create policy "Authenticated users can read news_items" on news_items for select to authenticated using (true);
create policy "Authenticated users can read filings_log" on filings_log for select to authenticated using (true);

-- ===== ADMIN / MONITORING TABLES =====

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,             -- news_cron|fundamentals_cron|filings_cron|deep_health
  status text not null check (status in ('running','success','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  rows_processed int default 0,
  error text
);
create index if not exists idx_job_runs_name_started on job_runs (job_name, started_at desc);

create table if not exists system_checks (
  id uuid primary key default gen_random_uuid(),
  component text not null,            -- api|database|scraper|gemini|groq|news_rss|screener|bse
  status text not null check (status in ('ok','degraded','down')),
  latency_ms int,
  detail text,
  checked_at timestamptz default now()
);
create index if not exists idx_system_checks_component on system_checks (component, checked_at desc);

create table if not exists scrape_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,               -- screener|bse|google_news|company_ir
  url text not null,
  status text not null check (status in ('success','failed')),
  http_code int,
  bytes int,
  duration_ms int,
  error text,
  created_at timestamptz default now()
);
create index if not exists idx_scrape_logs_source on scrape_logs (source, created_at desc);

create table if not exists llm_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null,             -- gemini|groq
  model text not null,
  purpose text not null,              -- moat|redflags|outlook|sentiment|summary
  tokens_in int default 0,
  tokens_out int default 0,
  latency_ms int,
  fallback boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_llm_usage_created on llm_usage (created_at desc);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,               -- invalidate_cache|force_reanalyze|run_job|retest_scraper
  target text,
  meta jsonb,
  created_at timestamptz default now()
);

-- Enable RLS for new tables
alter table profiles enable row level security;
alter table job_runs enable row level security;
alter table system_checks enable row level security;
alter table scrape_logs enable row level security;
alter table llm_usage enable row level security;
alter table audit_log enable row level security;

-- Profile RLS
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
-- Profiles writes restricted to service key (handled implicitly by Supabase when using service_role)

-- Admin Read Policies for Operational Tables
create policy "Admins can view job_runs" on job_runs for select using (exists (select 1 from profiles where id = auth.uid() and role='admin'));
create policy "Admins can view system_checks" on system_checks for select using (exists (select 1 from profiles where id = auth.uid() and role='admin'));
create policy "Admins can view scrape_logs" on scrape_logs for select using (exists (select 1 from profiles where id = auth.uid() and role='admin'));
create policy "Admins can view llm_usage" on llm_usage for select using (exists (select 1 from profiles where id = auth.uid() and role='admin'));
create policy "Admins can view audit_log" on audit_log for select using (exists (select 1 from profiles where id = auth.uid() and role='admin'));

-- Trigger to automatically create profile on signup and assign admin if email in ADMIN_EMAILS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_admin boolean := false;
  admin_emails_str text;
  admin_emails_arr text[];
begin
  -- Get ADMIN_EMAILS from environment or hardcode based on TRD. We will assume the service handles assigning role, OR we check a table.
  -- Since we cannot easily read env vars in Supabase postgres functions by default without setup, 
  -- we can just insert them as 'user'. The backend TRD §4B.2 says: "On signup trigger ... if user email in ADMIN_EMAILS env -> insert profiles row with role='admin', else 'user'."
  -- However, PostgreSQL doesn't read `.env`. So we will create the row with 'user' and the backend can escalate it on first login or we can just escalate it here if we pass the string.
  -- Wait, the TRD says "Supabase webhook or first-login check". I will default to 'user' here, and let the backend first-login check escalate if needed.
  
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  
  return new;
end;
$$;

-- Drop trigger if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

