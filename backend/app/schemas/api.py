from pydantic import BaseModel, Field
from typing import Optional, List

class FilterParams(BaseModel):
    category: Optional[List[str]]=None
    min_rating: float=3.5
    min_installs: float=50000
    min_reviews: float=500
    min_size: float=10
    max_size: float=100
    min_subjectivity: float=0.5
    game_only: bool=False
    show_outliers: bool=True
    search: Optional[str]=None
