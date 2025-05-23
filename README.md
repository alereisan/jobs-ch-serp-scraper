# Jobs.ch SERP Scraper

This Apify Actor scrapes the job listing pages (SERPs) on [jobs.ch](https://jobs.ch), filtering for roles relevant to **related job titles**. It is designed for outreach automation workflows, lead enrichment, or as a pre-stage to full job detail extraction.

---

## 🚀 Key Features

- Flexible search by keyword, location, categories, sort order, and publication date
- Optional filtering by **related job titles**
- Returns: title, company, location, job URL, workload, employment type, publish date, and pagination index
- Ideal for:
  - Talent agency signal detection
  - Recruiting lead generation
  - Automation pipelines with n8n, Zapier, Make.com

---

## 🧠 Input Schema

```json
{
  "keyword": "recruiter",
  "location": "Zurich",
  "categories": [100, 104, 105],
  "sortBy": "date",
  "publicationDate": "1",
  "page": 1,
  "maxPages": 1,
  "relevantTitles": [
    "recruiter", "recruiting", "talent acquisition",
    "personalberater", "headhunter", "hr business partner",
    "stellenvermittlung", "hr", "personalberatung", "payroll"
  ]
}
```

---

## 📦 Output Format

Each job listing includes:

```json
{
  "title": "Recruiter (m/w/d)",
  "company": "Santamaria Automations AG",
  "location": "Zurich",
  "url": "https://www.jobs.ch/en/vacancies/detail/xyz/",
  "workload": "80 – 100%",
  "employmentType": "Unlimited employment",
  "published": "1 hour ago",
  "page": 1
}
```

---

## ⚙️ Usage

1. **Local development**
   ```bash
   npm install
   npm start
   ```
2. **Deploy to Apify**
   ```bash
   apify push
   ```
3. **Trigger via API or n8n**
   ```http
   POST https://api.apify.com/v2/acts/USERNAME~jobs-ch-serp-scraper/runs?token=APIFY_API_TOKEN
   ```
   Pass your input JSON in the body. Results are stored in the default Apify dataset (downloadable via API or UI).

---

## 🔍 Notes

- Title filtering is optional and adjustable (via `relevantTitles`)
- Ideal as a first step before scraping full job descriptions
- Designed for use in automated sales triggers for recruiting agencies

---

## 👋 Maintained by [Santamaria Automations](https://www.alessandrosantamaria.com)

Need help integrating this with Notion ATS, n8n, Gmail Draft Outreach, or AI-based candidate scoring?

📬 [Book a 15 min strategy call](https://calendly.com/alessandro-santamaria/15min)

📧 [contact@alessandrosantamaria.com](mailto:contact@alessandrosantamaria.com) 