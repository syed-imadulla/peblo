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
    seen_show_ids = set()
    
    sections_to_search = [section] if section and section in catalogue else list(catalogue.keys())
    
    query_str = q.strip().lower() if q else None
    
    for sec in sections_to_search:
        shows = catalogue.get(sec, [])
        for show in shows:
            show_id = show.get("show_id") or show.get("slug")
            if show_id in seen_show_ids:
                continue
                
            match = True
            
            # Comprehensive text match across title, synopsis, categories, slug, and episodes
            if query_str:
                query_tokens = query_str.split()
                
                # Gather all searchable text for this show
                show_texts = [
                    show.get("title", ""),
                    show.get("synopsis", ""),
                    show.get("slug", ""),
                    show.get("type", ""),
                    " ".join(show.get("categories", [])),
                ]
                
                # Add all episode titles and synopses
                for season in show.get("seasons", []):
                    for ep in season.get("episodes", []):
                        show_texts.append(ep.get("title", ""))
                        show_texts.append(ep.get("synopsis", ""))
                        show_texts.append(ep.get("content_group", ""))
                        
                for tr in show.get("trailers", []):
                    show_texts.append(tr.get("title", ""))
                    show_texts.append(tr.get("synopsis", ""))
                    show_texts.append(tr.get("content_group", ""))
                    
                combined_text = " ".join(show_texts).lower()
                
                # All query tokens must match somewhere in the show or its episodes
                if not all(token in combined_text for token in query_tokens):
                    match = False
                    
            if category:
                cat_lower = category.strip().lower()
                show_cats = [c.lower() for c in show.get("categories", [])]
                if cat_lower not in show_cats:
                    match = False
                    
            if language:
                lang_lower = language.strip().lower()
                has_lang = False
                
                all_episodes = [
                    *(tr for tr in show.get("trailers", [])),
                    *(ep for s in show.get("seasons", []) for ep in s.get("episodes", []))
                ]
                for ep in all_episodes:
                    if lang_lower in [l.lower() for l in ep.get("languages", [])]:
                        has_lang = True
                        break
                        
                if not has_lang:
                    match = False
                    
            if match:
                seen_show_ids.add(show_id)
                results.append(show)
                
    return results
