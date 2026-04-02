"""Add creator_id to tournaments and add indexes for performance

Revision ID: 992a973c4ad5
Revises: 
Create Date: 2026-04-02 02:11:28.017885

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '992a973c4ad5'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add creator_id column to tournaments table
    with op.batch_alter_table('tournaments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('creator_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_tournaments_creator_id_users', 'users', ['creator_id'], ['id'])


def downgrade():
    with op.batch_alter_table('tournaments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_tournaments_creator_id_users', type_='foreignkey')
        batch_op.drop_column('creator_id')
