from app.models.models import User, Show, Season, Episode, Artwork

def test_models_exist():
    assert User.__tablename__ == 'users'
    assert Show.__tablename__ == 'shows'
    assert Season.__tablename__ == 'seasons'
    assert Episode.__tablename__ == 'episodes'
    assert Artwork.__tablename__ == 'artwork'
