"""Product endpoints."""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.api.deps import get_current_active_superuser, get_current_active_user
from app.crud.product import product as product_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.product import Product, ProductCreate, ProductUpdate

router = APIRouter()


@router.get("/", response_model=List[Product])
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: int = Query(None, description="Filter by category ID"),
    available_only: bool = Query(True, description="Show only available products"),
) -> Any:
    """Retrieve products."""
    if category_id:
        products = product_crud.get_by_category(db, category_id=category_id, skip=skip, limit=limit)
    elif available_only:
        products = product_crud.get_available(db, skip=skip, limit=limit)
    else:
        products = product_crud.get_multi(db, skip=skip, limit=limit)
    return products


@router.get("/search", response_model=List[Product])
def search_products(
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Search products by name."""
    products = product_crud.search_by_name(db, name=q, skip=skip, limit=limit)
    return products


@router.post("/", response_model=Product, status_code=status.HTTP_201_CREATED)
def create_product(
    *,
    db: Session = Depends(get_db),
    product_in: ProductCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Create new product (admin only)."""
    product = product_crud.create(db, obj_in=product_in)
    return product


@router.get("/{product_id}", response_model=Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """Get product by ID."""
    product = product_crud.get(db, id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.put("/{product_id}", response_model=Product)
def update_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Update a product (admin only)."""
    product = product_crud.get(db, id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    product = product_crud.update(db, db_obj=product, obj_in=product_in)
    return product


@router.delete("/{product_id}", response_model=Product)
def delete_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Delete a product (admin only)."""
    product = product_crud.get(db, id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    product = product_crud.delete(db, id=product_id)
    return product
