import json
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from app.services.storage import storage

router = APIRouter(prefix="/catalog")

@router.get("")
def get_catalog():
    content = storage.read("catalogue.json")
    if not content:
        raise HTTPException(status_code=404, detail="Catalogue not yet generated")
    return JSONResponse(content=json.loads(content))

@router.get("/search")
def search_catalog(
    q: str = None, 
    category: str = None, 
    language: str = None, 
    section: str = None
):
    content = storage.read("catalogue.json")
    if not content:
        raise HTTPException(status_code=404, detail="Catalogue not yet generated")
        
    catalogue = json.loads(content)
    results = []
    
    sections_to_search = [section] if section and section in catalogue else catalogue.keys()
    
    for sec in sections_to_search:
        shows = catalogue.get(sec, [])
        for show in shows:
            match = True
            
            # Simple text match on title or synopsis
            if q:
                if q.lower() not in show["title"].lower() and q.lower() not in (show.get("synopsis") or "").lower():
                    match = False
                    
            if category:
                if category.lower() not in [c.lower() for c in show.get("categories", [])]:
                    match = False
                    
            if language:
                # Need to check if any episode has the language
                has_lang = False
                for season in show.get("seasons", []):
                    for ep in season.get("episodes", []):
                        if language.lower() in [l.lower() for l in ep.get("languages", [])]:
                            has_lang = True
                            break
                    if has_lang:
                        break
                if not has_lang:
                    match = False
                    
            if match:
                results.append(show)
                
    return results
