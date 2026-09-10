# AppInsight Analytics

Production-style Next.js + FastAPI analytics website for the supplied `googleplaystore.csv` dataset.

## Important data-integrity finding
The supplied CSV has 10,841 rows and 13 columns. It contains app metadata and review **counts**, but no review text and no sentiment-subjectivity column. Therefore the required `Subjectivity > 0.5` condition cannot be calculated from this file without inventing data. This project intentionally **does not fabricate subjectivity**. The pipeline reports the blocked stage and the protected hexbin endpoint returns a clear 409 rather than presenting an invalid “fully filtered” chart.

Observed source columns: App, Category, Rating, Reviews, Size, Installs, Type, Price, Content Rating, Genres, Last Updated, Current Ver, Android Ver.

The real-data preprocessing also found 483 exact duplicate rows and 1,474 missing Rating values. Numeric formats such as `50,000+` and `10M` are normalized.

## Architecture
- `frontend/`: Next.js, TypeScript, Tailwind CSS, ECharts, Framer Motion, Lucide
- `backend/`: FastAPI, Pandas, NumPy, SciPy
- `data/raw/googleplaystore.csv`: supplied real dataset
- `backend/app/analytics/`: cleaning, IQR, hexbin aggregation

## Run locally
### Backend
```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
Open `http://localhost:3000`.

## Required rules implemented
- Nine requested categories only.
- Rating > 3.5, installs > 50,000, reviews > 500, size 10–100 MB.
- Case-insensitive app-name `S/s` exclusion.
- Subjectivity is only used if a real source subjectivity column exists; no synthetic NLP values are created.
- Category-level IQR for size and rating.
- Server-side 5:00 PM inclusive to 7:00 PM exclusive Asia/Kolkata protection for the hexbin endpoint.
- UI translation display: Beauty → ब्यूटी; Business → வணிகம்; Dating → Partnersuche.

## Deployment
Render can run the backend with the included `render.yaml`. Vercel can deploy `frontend/`; configure `NEXT_PUBLIC_API_URL` to the Render API URL and configure production CORS accordingly.

## Testing
```bash
pytest backend/tests
```

## Next data requirement
To unlock the complete requested hexbin analysis, provide a real subjectivity field (0–1) or the underlying review text from the same dataset. The application is deliberately designed to detect and use it automatically when present.
