"""Category endpoints."""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_active_superuser, get_current_active_user
from app.crud.category import category as category_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.category import Category, CategoryCreate, CategoryUpdate

router = APIRouter()


@router.get("/", response_model=List[Category])
def read_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve categories."""
    categories = category_crud.get_active(db, skip=skip, limit=limit)
    return categories


@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category(
    *,
    db: Session = Depends(get_db),
    category_in: CategoryCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Create new category (admin only)."""
    category = category_crud.get_by_name(db, name=category_in.name)
    if category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )
    category = category_crud.create(db, obj_in=category_in)
    return category


@router.get("/{category_id}", response_model=Category)
def read_category(
    category_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """Get category by ID."""
    category = category_crud.get(db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.put("/{category_id}", response_model=Category)
def update_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    category_in: CategoryUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Update a category (admin only)."""
    category = category_crud.get(db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    category = category_crud.update(db, db_obj=category, obj_in=category_in)
    return category


@router.delete("/{category_id}", response_model=Category)
def delete_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Delete a category (admin only)."""
    category = category_crud.get(db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    category = category_crud.delete(db, id=category_id)
    return category
