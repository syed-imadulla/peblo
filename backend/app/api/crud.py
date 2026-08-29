from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.models import Show, Season, Episode, Artwork
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_user)])

# --- SCHEMAS ---
class ArtworkSchema(BaseModel):
    id: UUID
    type: str
    url: str
    size_bytes: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EpisodeCreate(BaseModel):
    season_id: UUID
    episode_title: str
    slug: Optional[str] = None
    episode_number: Optional[int] = None
    synopsis: Optional[str] = None
    status: str
    duration_seconds: Optional[int] = None
    language: Optional[str] = None
    content_group: str
    availability: Optional[str] = "All Regions"

class EpisodeSchema(EpisodeCreate):
    id: UUID
    artwork: List[ArtworkSchema] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SeasonCreate(BaseModel):
    show_id: UUID
    season_number: int

class SeasonSchema(SeasonCreate):
    id: UUID
    episodes: List[EpisodeSchema] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ShowCreate(BaseModel):
    title: str
    slug: str
    section: Optional[str] = None
    categories: List[str] = []
    synopsis: Optional[str] = None

class ShowSchema(ShowCreate):
    id: UUID
    seasons: List[SeasonSchema] = []
    artwork: List[ArtworkSchema] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- SHOW ENDPOINTS ---
@router.get("/shows", response_model=List[ShowSchema])
def list_shows(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    shows = db.query(Show).offset(skip).limit(limit).all()
    return shows

@router.get("/shows/{show_id}", response_model=ShowSchema)
def get_show(show_id: UUID, db: Session = Depends(get_db)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    return show

@router.post("/shows", response_model=ShowSchema)
def create_show(show_data: ShowCreate, db: Session = Depends(get_db)):
    existing = db.query(Show).filter(Show.slug == show_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    show = Show(**show_data.model_dump())
    db.add(show)
    db.commit()
    db.refresh(show)
    return show

@router.put("/shows/{show_id}", response_model=ShowSchema)
def update_show(show_id: UUID, show_data: ShowCreate, db: Session = Depends(get_db)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
        
    for key, value in show_data.model_dump().items():
        setattr(show, key, value)
        
    db.commit()
    db.refresh(show)
    return show

@router.delete("/shows/{show_id}")
def delete_show(show_id: UUID, db: Session = Depends(get_db)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    db.delete(show)
    db.commit()
    return {"status": "ok"}


# --- SEASON ENDPOINTS ---
@router.post("/seasons", response_model=SeasonSchema)
def create_season(season_data: SeasonCreate, db: Session = Depends(get_db)):
    existing = db.query(Season).filter(
        Season.show_id == season_data.show_id,
        Season.season_number == season_data.season_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Season number already exists for this show")
        
    season = Season(**season_data.model_dump())
    db.add(season)
    db.commit()
    db.refresh(season)
    return season

@router.delete("/seasons/{season_id}")
def delete_season(season_id: UUID, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    db.delete(season)
    db.commit()
    return {"status": "ok"}


# --- EPISODE ENDPOINTS ---
def validate_episode_uniqueness(db: Session, episode_data: EpisodeCreate, exclude_id: Optional[UUID] = None):
    query = db.query(Episode).filter(
        Episode.content_group == episode_data.content_group,
        Episode.language == episode_data.language
    )
    if exclude_id:
        query = query.filter(Episode.id != exclude_id)
        
    if query.first():
        raise HTTPException(status_code=400, detail="An episode with this content group and language already exists")

@router.post("/episodes", response_model=EpisodeSchema)
def create_episode(episode_data: EpisodeCreate, db: Session = Depends(get_db)):
    validate_episode_uniqueness(db, episode_data)
    
    episode = Episode(**episode_data.model_dump())
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode

@router.put("/episodes/{episode_id}", response_model=EpisodeSchema)
def update_episode(episode_id: UUID, episode_data: EpisodeCreate, db: Session = Depends(get_db)):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
        
    validate_episode_uniqueness(db, episode_data, exclude_id=episode_id)
    
    for key, value in episode_data.model_dump().items():
        setattr(episode, key, value)
        
    db.commit()
    db.refresh(episode)
    return episode

@router.get("/episodes/{episode_id}", response_model=EpisodeSchema)
def get_episode(episode_id: UUID, db: Session = Depends(get_db)):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode

@router.delete("/episodes/{episode_id}")
def delete_episode(episode_id: UUID, db: Session = Depends(get_db)):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    db.delete(episode)
    db.commit()
    return {"status": "ok"}
