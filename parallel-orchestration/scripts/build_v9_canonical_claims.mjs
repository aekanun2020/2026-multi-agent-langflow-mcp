import fs from "node:fs";

const sourcePath = process.argv[2] ?? "flows/LAB-1-4-withlocal-concurrent-consensus-v8-guarded-verbalizer-thai.json";
const outputPath = process.argv[3] ?? "flows/LAB-1-4-withlocal-concurrent-consensus-v9-canonical-claims-thai.json";
const flow = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const nodes = flow.data.nodes;
const workers = [1, 2, 3].map((number) => nodes.find((node) => node.id === `Agent-ConsensusWorker${number}`));
const aggregator = nodes.find((node) => node.id === "ConsensusVoteAggregator-main");
if (workers.some((worker) => !worker) || !aggregator) throw new Error("Required v8 nodes not found");

flow.name = "LAB-1-4-withlocal-concurrent-consensus-v9-canonical-claims-thai";
flow.description = "Financial concurrent consensus with canonical intent-specific claim schemas, precision-safe SQL rules, and deterministic final guard.";

const canonicalContract = `

CANONICAL CLAIM CONTRACT — บังคับใช้:
เลือก contract ที่ตรงกับคำถามเพียงหนึ่งรายการ และคืนเฉพาะ claim keys ตาม schema นั้น ห้ามตั้งชื่อ key เอง ห้ามเพิ่ม metric ที่ไม่ได้ร้องขอ

1. finance_portfolio_totals
claims: loan_count, requested_total, funded_total, requested_avg, funded_avg

2. finance_application_mix
claims: application_mix
value ต้องเป็น list เรียง Individual แล้ว Joint App แต่ละรายการมี application_type, loan_count, portfolio_pct

3. finance_status_mix
claims: status_distribution
value ต้องเป็น list ครบทุก canonical status เรียง loan_count จากมากไปน้อย แต่ละรายการมี loan_status, loan_count, portfolio_pct

4. finance_year_cohorts
claims: year_cohorts
value เป็น list ปี 2016-2019 แต่ละรายการมี year, loan_count, avg_funded_amnt, avg_int_rate_pct ห้ามใช้ funded total หรือ weighted rate แทน average

5. finance_home_ownership_segments
claims: home_ownership_segments
value เป็น list ครบทุก label แต่ละรายการมี home_ownership, loan_count, avg_funded_amnt, avg_int_rate_pct, avg_dti ห้ามใช้ totals/weighted rate

6. finance_employment_extrema
claims: employment_extrema
value เป็น object มี highest, lowest_overall, lowest_excluding_na โดยใช้ avg_funded_amnt เป็นเกณฑ์ แต่ละส่วนต้องมี emp_length, loan_count, avg_funded_amnt และเมื่อโจทย์ขอให้มี avg_int_rate_pct, avg_dti

7. finance_dti_buckets
claims: dti_buckets
value เป็น list ตามลำดับ <10, 10-<20, 20-<30, 30+, NULL แต่ละรายการมี dti_bucket, loan_count, avg_funded_amnt, avg_int_rate_pct
นี่คือ RAW BUCKET CONTRACT: ห้ามตัด negative, 999 หรือ outlier เพิ่ม เพราะค่าดังกล่าวต้องตกใน bucket ตาม CASE ของโจทย์ เว้นแต่โจทย์ขอ validated DTI policy analysis โดยตรง
คำถาม paraphrase ที่กล่าวเพียงการแบ่งภาระหนี้ต่อรายได้เป็นช่วงต่ำกว่า 10, 10 ถึงต่ำกว่า 20, 20 ถึงต่ำกว่า 30, ตั้งแต่ 30 และข้อมูลว่าง ให้ใช้ contract นี้เต็มรูปแบบและคืน count, avg_funded_amnt, avg_int_rate_pct ทุก bucket ห้ามตอบเฉพาะ policy หรือ valid-DTI count

8. finance_fixed_income_bands
claims: income_bands
value เป็น list <50000, 50000-<70000, 70000-<100000, 100000+ สำหรับ Individual และ annual_inc NOT NULL แต่ละรายการมี income_band, loan_count, min_annual_inc, max_annual_inc, avg_funded_amnt, avg_int_rate_pct, avg_dti
จำนวน loan_count และ AVG DTI ใช้ population เดียวกันคือ Individual + annual_inc NOT NULL ห้ามตัดแถวเพราะ dti เป็น NULL/negative/outlier; AVG(dti) ให้ SQL จัดการ NULL ตามปกติ

9. finance_funding_gap_by_year
claims: funding_gap_by_year
value เป็น list ปี 2016-2019 แต่ละรายการมี year, requested_total, funded_total, funding_gap, funding_ratio โดย funding_ratio = SUM(funded_amnt)/SUM(loan_amnt) และไม่ใช่ approval rate

10. finance_dual_risk_screen
claims: portfolio_benchmarks, qualifying_segments
portfolio_benchmarks มี avg_int_rate_pct และ charged_off_share_pct
qualifying_segments เป็น list ของทุก emp_length ที่ทั้งสอง metric มากกว่า benchmark แบบ strict โดยมี emp_length, loan_count, avg_int_rate_pct, charged_off_share_pct

PRECISION CONTRACT:
- สำหรับ COUNT/SUM ใช้ COUNT_BIG และ CAST(SUM(...) AS DECIMAL(38,2)); ห้ามอาศัย scientific notation ที่ tool แสดง
- หาก tool แสดง SUM เป็น scientific notation ให้ query ซ้ำโดย CAST เป็น VARCHAR(50) หรือ DECIMAL(38,2) ก่อนสร้าง claim
- totals/counts ต้อง exact ห้ามปัดเป็นหลักพัน/ล้าน
- averages/rates query ด้วย DECIMAL อย่างน้อย 6 ตำแหน่ง และค่อยปัดเฉพาะค่าที่ schema ขอ
- สำหรับ composite list/object claims ให้แสดง avg_funded_amnt, avg_int_rate_pct, avg_dti, min/max เป็น JSON number ที่ ROUND 2 ตำแหน่งเหมือนกันทุก Agent และ counts เป็น integer
- int_rate เก็บเป็น fraction; avg_int_rate_pct = AVG(int_rate) * 100

ค่า claim แบบ list/object ต้องรักษาชื่อ field และลำดับตาม contract เพื่อให้ deterministic canonicalization จับ consensus ได้`;

workers.forEach((worker, index) => {
  worker.data.node.display_name = `Canonical Loan Analyst ${index + 1}`;
  worker.data.node.description = "Independent loan analyst constrained by intent-specific canonical claim schemas.";
  worker.data.node.template.system_prompt.value += canonicalContract;
  worker.data.node.template.temperature.value = 0;
  worker.data.node.template.max_iterations.value = Math.min(Number(worker.data.node.template.max_iterations.value || 15), 15);
});

let code = aggregator.data.node.template.code.value;
code = code.replace(
  "class ConsensusVoteAggregator(Component):",
  `class ConsensusVoteAggregator(Component):\n    KEY_ALIASES = {\n        "requested_amount_total": "requested_total",\n        "funded_amount_total": "funded_total",\n        "average_requested_amount": "requested_avg",\n        "average_loan_amnt": "requested_avg",\n        "average_funded_amount": "funded_avg",\n        "average_funded_amnt": "funded_avg",\n        "application_type_distribution": "application_mix",\n        "loan_status_distribution": "status_distribution",\n        "yearly_cohorts": "year_cohorts",\n        "home_ownership_distribution": "home_ownership_segments",\n        "emp_length_extrema": "employment_extrema",\n        "dti_bucket_distribution": "dti_buckets",\n        "fixed_income_bands": "income_bands",\n        "yearly_funding_gap": "funding_gap_by_year",\n        "dual_risk_segments": "qualifying_segments",\n    }\n\n    @classmethod\n    def _normalize_key(cls, key):\n        normalized = str(key).strip().lower()\n        return cls.KEY_ALIASES.get(normalized, normalized)`,
);
code = code.replace('"key": str(claim["key"]),', '"key": cls._normalize_key(claim["key"]),');
aggregator.data.node.template.code.value = code;
aggregator.data.node.metadata.code_hash = "canonical-consensus-v9";
aggregator.data.node.description = "Normalize canonical finance claim keys and apply deterministic 2-of-3 value consensus.";

fs.writeFileSync(outputPath, `${JSON.stringify(flow, null, 2)}\n`);
console.log(outputPath);
