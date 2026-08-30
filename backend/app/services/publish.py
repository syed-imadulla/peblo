import json
import uuid
import os
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.models.models import Show, Season, Episode, PublishRun, SystemSettings
from app.services.validation import ValidationService
from app.services.storage import storage

class PublishService:
    @staticmethod
    def publish_catalogue(db: Session, triggered_by: str = None) -> PublishRun:
        start_time = time.time()
        # 1. Fetch all published records with relationships eagerly loaded
        episodes = db.query(Episode).options(
            joinedload(Episode.season).joinedload(Season.show)
        ).filter(Episode.status == 'published').all()
        
        total_processed = len(episodes)
        
        valid_episodes = []
        blocked = 0
        error_log = []
        
        # 2. Validation
        for ep in episodes:
            errors = ValidationService.validate_for_publish(db, ep)
            if errors.has_blocking_errors():
                blocked += 1
                for issue in errors.issues:
                    error_log.append(issue.model_dump())
            else:
                valid_episodes.append(ep)
                
        published_records = len(valid_episodes)
        
        status = "failed"
        stats = None
        if published_records > 0:
            catalogue = PublishService._generate_catalogue(valid_episodes)
            catalogue_json = json.dumps(catalogue, indent=2, sort_keys=True)
            
            settings = db.query(SystemSettings).first()
            is_atomic = settings.atomic_publish if settings else True
            gen_backup = settings.generate_backup if settings else False
            ext = settings.catalogue_format.lower() if settings and settings.catalogue_format else "json"
            if ext not in ["json"]:
                ext = "json"

            final_name = f"catalogue.{ext}"

            if is_atomic:
                temp_name = f"catalogue_temp_{uuid.uuid4().hex}.{ext}"
                storage.write(temp_name, catalogue_json)
                storage.rename(temp_name, final_name)
            else:
                storage.write(final_name, catalogue_json)
                
            if gen_backup:
                backup_name = f"catalogue_backup_{int(time.time())}.{ext}"
                storage.write(backup_name, catalogue_json)
            
            status = "success"
            
            # Calculate stats
            unique_shows = set()
            unique_languages = set()
            unique_sections = set()
            unique_content_groups = set()
            
            for ep in valid_episodes:
                unique_shows.add(ep.season.show_id)
                unique_languages.add(ep.language)
                unique_content_groups.add(ep.content_group)
                if ep.season.show.section:
                    unique_sections.add(ep.season.show.section)
                    
            stats = {
                "shows": len(unique_shows),
                "episodes": len(unique_content_groups),
                "languages": len(unique_languages),
                "sections": len(unique_sections)
            }
        else:
            error_log.append({"type": "empty_catalogue", "description": "No valid records to publish"})

        duration_seconds = int(time.time() - start_time)

        # Record run
        run = PublishRun(
            id=str(uuid.uuid4()),
            status=status,
            total_records_processed=total_processed,
            published_records=published_records,
            blocked_records=blocked,
            error_log=error_log,
            stats=stats,
            duration_seconds=duration_seconds
        )
        if triggered_by:
            run.triggered_by = triggered_by
            
        db.add(run)
        db.commit()
        
        return run

    @staticmethod
    def preview_catalogue(db: Session) -> Dict[str, Any]:
        episodes = db.query(Episode).options(
            joinedload(Episode.season).joinedload(Season.show)
        ).filter(Episode.status == 'published').all()
        
        valid_episodes = []
        for ep in episodes:
            errors = ValidationService.validate_for_publish(db, ep)
            if not errors.has_blocking_errors():
                valid_episodes.append(ep)
                
        if len(valid_episodes) > 0:
            return PublishService._generate_catalogue(valid_episodes)
        return {}

    @staticmethod
    def _generate_catalogue(episodes: List[Episode]) -> Dict[str, Any]:
        catalogue = {
            "featured": [],
            "series": [],
            "minisodes": [],
            "songs": []
        }
        
        # First, aggregate episodes by content_group
        cg_map = {}
        for ep in episodes:
            cg = ep.content_group
            if cg not in cg_map:
                artworks = {}
                for art in ep.artwork:
                    artworks[art.type] = art.url
                    
                cg_map[cg] = {
                    "content_group": cg,
                    "title": ep.episode_title,
                    "duration_seconds": ep.duration_seconds,
                    "languages": set(),
                    "artwork": artworks,
                    "_show": ep.season.show,
                    "_season_number": ep.season.season_number
                }
            cg_map[cg]["languages"].add(ep.language)
            
        # Second, structure into shows and seasons
        shows_map = {}
        for cg, data in cg_map.items():
            show = data["_show"]
            s_num = data["_season_number"]
            
            if show.id not in shows_map:
                shows_map[show.id] = {
                    "show_id": str(show.id),
                    "title": show.title,
                    "slug": show.slug,
                    "synopsis": show.synopsis,
                    "categories": show.categories,
                    "seasons": {},
                    "trailers": [],
                    "_section": show.section
                }
                
            # clean episode output
            ep_out = {
                "content_group": data["content_group"],
                "title": data["title"],
                "duration_seconds": data["duration_seconds"],
                "languages": sorted(list(data["languages"])),
                "artwork": data["artwork"]
            }
            
            if s_num == 0:
                shows_map[show.id]["trailers"].append(ep_out)
            else:
                if s_num not in shows_map[show.id]["seasons"]:
                    shows_map[show.id]["seasons"][s_num] = {
                        "season_number": s_num,
                        "episodes": []
                    }
                shows_map[show.id]["seasons"][s_num]["episodes"].append(ep_out)

        # Third, format and sort the tree
        for show_id, s_data in shows_map.items():
            section = s_data["_section"]
            
            # format seasons to array
            sorted_seasons = []
            for s_num in sorted(s_data["seasons"].keys()):
                season_obj = s_data["seasons"][s_num]
                season_obj["episodes"] = sorted(season_obj["episodes"], key=lambda x: x["content_group"])
                sorted_seasons.append(season_obj)
                
            s_data["seasons"] = sorted_seasons
            s_data["trailers"] = sorted(s_data["trailers"], key=lambda x: x["content_group"])
            
            del s_data["_section"]
            
            if section in catalogue:
                catalogue[section].append(s_data)
                
        # Sort shows within sections
        for section in catalogue:
            catalogue[section] = sorted(catalogue[section], key=lambda x: x["title"])
            
        return catalogue
