import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, CheckConstraint, UniqueConstraint, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Show(Base):
    __tablename__ = "shows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    section = Column(String, nullable=True)
    categories = Column(JSONB, nullable=False, default=list)
    synopsis = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan")
    artwork = relationship("Artwork", cascade="all, delete-orphan", primaryjoin="Show.id == Artwork.show_id")


class Season(Base):
    __tablename__ = "seasons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    show_id = Column(UUID(as_uuid=True), ForeignKey("shows.id", ondelete="CASCADE"), nullable=False)
    season_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('show_id', 'season_number', name='uq_show_season'),
    )

    show = relationship("Show", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan")
    artwork = relationship("Artwork", cascade="all, delete-orphan", primaryjoin="Season.id == Artwork.season_id")


class Episode(Base):
    __tablename__ = "episodes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    season_id = Column(UUID(as_uuid=True), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False)
    episode_title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)
    episode_number = Column(Integer, nullable=True)
    synopsis = Column(String, nullable=True)
    status = Column(String, nullable=False) # 'draft' or 'published'
    duration_seconds = Column(Integer, nullable=True)
    language = Column(String, nullable=True)
    content_group = Column(String, nullable=False)
    availability = Column(String, default="All Regions", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_episodes_content_group', 'content_group'),
        Index('ix_episodes_status', 'status'),
    )

    season = relationship("Season", back_populates="episodes")
    artwork = relationship("Artwork", cascade="all, delete-orphan", primaryjoin="Episode.id == Artwork.episode_id")


class Artwork(Base):
    __tablename__ = "artwork"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    show_id = Column(UUID(as_uuid=True), ForeignKey("shows.id", ondelete="CASCADE"), nullable=True)
    season_id = Column(UUID(as_uuid=True), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=True)
    episode_id = Column(UUID(as_uuid=True), ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True)
    type = Column(String, nullable=False) # 'banner', 'thumbnail', etc
    url = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "(show_id IS NOT NULL)::int + (season_id IS NOT NULL)::int + (episode_id IS NOT NULL)::int = 1",
            name="check_artwork_single_entity"
        ),
    )


class PublishRun(Base):
    __tablename__ = "publish_runs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, nullable=False) # 'success', 'failed'
    total_records_processed = Column(Integer, nullable=False)
    published_records = Column(Integer, nullable=False)
    blocked_records = Column(Integer, nullable=False)
    error_log = Column(JSONB, nullable=True)
    stats = Column(JSONB, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, default=1)
    
    # Site Info
    site_name = Column(String, nullable=False, default="PeBLo CMS")
    admin_email = Column(String, nullable=False, default="admin@peblo.tv")
    site_url = Column(String, nullable=False, default="http://localhost:5173")
    timezone = Column(String, nullable=False, default="Asia/Kolkata (GMT+05:30)")
    
    # Default Content Settings
    default_section = Column(String, nullable=False, default="featured")
    default_languages = Column(JSONB, nullable=False, default=["EN", "HI"])
    default_status = Column(String, nullable=False, default="Draft")
    season_0_handling = Column(String, nullable=False, default="Reserved for trailers (hidden in viewer)")
    content_grouping = Column(String, nullable=False, default="Group language variants into single episode")
    
    # Publishing Preferences
    auto_publish = Column(Boolean, nullable=False, default=False)
    generate_backup = Column(Boolean, nullable=False, default=True)
    catalogue_format = Column(String, nullable=False, default="JSON")
    atomic_publish = Column(Boolean, nullable=False, default=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
