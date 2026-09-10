from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import router

app=FastAPI(title='AppInsight Analytics API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:3000'], allow_credentials=True, allow_methods=['GET'], allow_headers=['*'])
app.include_router(router)

@app.get('/health')
def health(): return {'status':'ok'}

@app.exception_handler(Exception)
async def generic_error(_, exc): return JSONResponse(status_code=500, content={'error':'Internal server error'})
