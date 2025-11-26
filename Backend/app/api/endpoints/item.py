from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/items",
    tags=["Items [Menu]"],
)
# @router.get("/", response_model=List[str]){
#     def read_items(db: Session = Depends(get_db)):
# }