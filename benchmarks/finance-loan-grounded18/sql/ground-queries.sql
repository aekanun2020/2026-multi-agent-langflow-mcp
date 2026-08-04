-- Finance/Loan Grounded-18 canonical read-only queries.

-- finance_portfolio_totals
SELECT COUNT_BIG(*) AS loan_count, SUM(loan_amnt) AS requested_total,
       SUM(funded_amnt) AS funded_total, AVG(loan_amnt) AS requested_avg,
       AVG(funded_amnt) AS funded_avg
FROM loans_fact;

-- finance_application_mix
SELECT a.application_type, COUNT_BIG(*) AS loan_count,
       CAST(100.0 * COUNT_BIG(*) / SUM(COUNT_BIG(*)) OVER () AS decimal(10,4)) AS portfolio_pct
FROM loans_fact AS l JOIN application_type_dim AS a ON l.application_type_id=a.application_type_id
GROUP BY a.application_type;

-- finance_status_mix
SELECT s.loan_status, COUNT_BIG(*) AS loan_count,
       CAST(100.0 * COUNT_BIG(*) / SUM(COUNT_BIG(*)) OVER () AS decimal(10,4)) AS portfolio_pct
FROM loans_fact AS l JOIN loan_status_dim AS s ON l.loan_status_id=s.loan_status_id
GROUP BY s.loan_status;

-- finance_year_cohorts
SELECT i.year, COUNT_BIG(*) AS loan_count, AVG(l.funded_amnt) AS avg_funded_amnt,
       AVG(l.int_rate) AS avg_int_rate
FROM loans_fact AS l JOIN issue_d_dim AS i ON l.issue_d_id=i.issue_d_id
GROUP BY i.year;

-- finance_home_ownership_segments
SELECT h.home_ownership, COUNT_BIG(*) AS loan_count, AVG(l.funded_amnt) AS avg_funded_amnt,
       AVG(l.int_rate) AS avg_int_rate, AVG(l.dti) AS avg_dti
FROM loans_fact AS l JOIN home_ownership_dim AS h ON l.home_ownership_id=h.home_ownership_id
GROUP BY h.home_ownership;

-- finance_employment_extrema (select extrema from this grouped result)
SELECT e.emp_length, COUNT_BIG(*) AS loan_count, AVG(l.funded_amnt) AS avg_funded_amnt,
       AVG(l.int_rate) AS avg_int_rate, AVG(l.dti) AS avg_dti
FROM loans_fact AS l JOIN emp_length_dim AS e ON l.emp_length_id=e.emp_length_id
GROUP BY e.emp_length;

-- finance_dti_buckets: raw semantics; NULL is separate, no additional outlier filter.
WITH bucketed AS (
  SELECT CASE WHEN dti IS NULL THEN 'NULL' WHEN dti < 10 THEN '<10'
              WHEN dti < 20 THEN '10-<20' WHEN dti < 30 THEN '20-<30'
              ELSE '30+' END AS dti_bucket, funded_amnt, int_rate
  FROM loans_fact
)
SELECT dti_bucket, COUNT_BIG(*) AS loan_count, AVG(funded_amnt) AS avg_funded_amnt,
       AVG(int_rate) AS avg_int_rate
FROM bucketed GROUP BY dti_bucket;

-- finance_fixed_income_bands
WITH banded AS (
  SELECT CASE WHEN annual_inc < 50000 THEN '<50000'
              WHEN annual_inc < 70000 THEN '50000-<70000'
              WHEN annual_inc < 100000 THEN '70000-<100000'
              ELSE '100000+' END AS income_band,
         annual_inc, funded_amnt, int_rate, dti
  FROM loans_fact
  WHERE application_type='Individual' AND annual_inc IS NOT NULL
)
SELECT income_band, COUNT_BIG(*) AS loan_count, MIN(annual_inc) AS min_annual_inc,
       MAX(annual_inc) AS max_annual_inc, AVG(funded_amnt) AS avg_funded_amnt,
       AVG(int_rate) AS avg_int_rate, AVG(dti) AS avg_dti
FROM banded GROUP BY income_band;

-- finance_funding_gap_by_year
SELECT i.year, SUM(l.loan_amnt) AS requested_total, SUM(l.funded_amnt) AS funded_total,
       SUM(l.loan_amnt-l.funded_amnt) AS funding_gap,
       SUM(l.funded_amnt)/NULLIF(SUM(l.loan_amnt),0) AS funding_ratio
FROM loans_fact AS l JOIN issue_d_dim AS i ON l.issue_d_id=i.issue_d_id
GROUP BY i.year;

-- finance_dual_risk_screen
WITH overall AS (
  SELECT AVG(l.int_rate) AS overall_avg_int_rate,
         AVG(CASE WHEN s.loan_status='Charged Off' THEN 1.0 ELSE 0.0 END) AS overall_charged_off_rate
  FROM loans_fact AS l JOIN loan_status_dim AS s ON l.loan_status_id=s.loan_status_id
), segments AS (
  SELECT e.emp_length, COUNT_BIG(*) AS loan_count, AVG(l.int_rate) AS avg_int_rate,
         AVG(CASE WHEN s.loan_status='Charged Off' THEN 1.0 ELSE 0.0 END) AS charged_off_rate
  FROM loans_fact AS l
  JOIN emp_length_dim AS e ON l.emp_length_id=e.emp_length_id
  JOIN loan_status_dim AS s ON l.loan_status_id=s.loan_status_id
  GROUP BY e.emp_length
)
SELECT s.*, o.* FROM segments AS s CROSS JOIN overall AS o;
