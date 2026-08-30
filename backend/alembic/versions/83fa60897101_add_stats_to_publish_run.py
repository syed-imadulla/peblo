"""add stats to publish run

Revision ID: 83fa60897101
Revises: 18170005b613
Create Date: 2026-08-30 11:38:30.937528

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83fa60897101'
down_revision: Union[str, Sequence[str], None] = '18170005b613'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    op.add_column('publish_runs', sa.Column('stats', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('publish_runs', 'stats')
