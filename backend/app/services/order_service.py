"""Order service - Business logic for order operations."""
from typing import Dict, List, Optional
from datetime import datetime
from sqlmodel import Session
from fastapi import HTTPException, status

from app.crud.order import order as order_crud
from app.crud.cart import cart as cart_crud
from app.crud.table import table as table_crud
from app.crud.reservation import reservation as reservation_crud
from app.crud.product import product as product_crud
from app.models.order import Order
from app.schemas.order import OrderCreate
from app.services.email_service import email_service
from app.utils.enums import OrderStatus, PaymentStatus, TableStatus, ReservationStatus


class OrderService:
    """Service for order business logic."""

    @staticmethod
    def _build_status_email_payload(order: Order, status: OrderStatus) -> Optional[Dict[str, str]]:
        """Build email content for each order status."""
        if not order or not order.user or not order.user.email:
            return None

        user_name = order.user.full_name or order.user.email

        # Reservation & table info
        reservation_date = None
        reservation_slot = None
        if order.reservation and order.reservation.start_time and order.reservation.end_time:
            reservation_date = order.reservation.start_time.strftime("%d/%m/%Y")
            reservation_slot = (
                f"{order.reservation.start_time.strftime('%H:%M')} - "
                f"{order.reservation.end_time.strftime('%H:%M')}"
            )
        elif order.reservation and order.reservation.start_time:
            reservation_date = order.reservation.start_time.strftime("%d/%m/%Y")
            reservation_slot = order.reservation.start_time.strftime("%H:%M")

        table_label = None
        if order.table:
            table_label = f"Bàn {order.table.table_number}"
            if order.table.location:
                table_label += f" • {order.table.location}"

        total_items = sum(item.quantity for item in order.items)
        order_total = order.total_amount or 0
        formatted_total = f"{order_total:,.0f} đ".replace(",", ".")

        items_html = "".join(
            f"""
            <tr>
                <td style="padding:8px 0;color:#1f1f1f;">{item.product.name if item.product else 'Món ăn'}</td>
                <td style="padding:8px 0;color:#1f1f1f;text-align:center;">x{item.quantity}</td>
                <td style="padding:8px 0;color:#1f1f1f;text-align:right;">{item.subtotal:,.0f} đ</td>
            </tr>
            """
            for item in order.items
        )

        status_configs: Dict[OrderStatus, Dict[str, str]] = {
            OrderStatus.PENDING: {
                "badge": "CHỜ XÁC NHẬN",
                "headline": f"Đơn hàng #{order.id} đã được ghi nhận",
                "intro": "Chúng tôi đã tiếp nhận yêu cầu và sẽ xác nhận sớm nhất.",
                "note": "Bạn sẽ nhận thêm email khi đơn được xác nhận hoặc có cập nhật mới.",
                "gradient": "linear-gradient(135deg,#312e81,#9333ea)",
            },
            OrderStatus.CONFIRMED: {
                "badge": "ĐÃ XÁC NHẬN",
                "headline": f"Đơn hàng #{order.id} đã được xác nhận",
                "intro": "Chúng tôi đã nhận đơn và đang chuẩn bị nguyên liệu.",
                "note": "Bạn có thể tiếp tục theo dõi trạng thái tại trang Đơn hàng.",
                "gradient": "linear-gradient(135deg,#1f1147,#5c164e)",
            },
            OrderStatus.PREPARING: {
                "badge": "ĐANG CHUẨN BỊ",
                "headline": f"Chúng tôi đang chế biến đơn #{order.id}",
                "intro": "Đội bếp đang thao tác, món ăn sẽ sẵn sàng trong ít phút nữa.",
                "note": "Hãy giữ điện thoại bên mình, chúng tôi sẽ báo ngay khi món hoàn tất.",
                "gradient": "linear-gradient(135deg,#3a0b52,#a83279)",
            },
            OrderStatus.READY: {
                "badge": "SẴN SÀNG",
                "headline": f"Món ăn của bạn đã sẵn sàng!",
                "intro": "Bàn và đơn #{order.id} đã sẵn sàng để phục vụ.",
                "note": "Bạn có thể đến nhận tại quầy hoặc ra bàn theo thông tin bên dưới.",
                "gradient": "linear-gradient(135deg,#0f766e,#22d3ee)",
            },
            OrderStatus.COMPLETED: {
                "badge": "HOÀN THÀNH",
                "headline": "Cảm ơn bạn đã dùng bữa!",
                "intro": "Đơn hàng đã hoàn tất. Hy vọng bạn hài lòng với trải nghiệm hôm nay.",
                "note": "Nếu có góp ý, hãy trả lời email này để chúng tôi phục vụ tốt hơn.",
                "gradient": "linear-gradient(135deg,#1d4ed8,#7c3aed)",
            },
            OrderStatus.CANCELLED: {
                "badge": "ĐÃ HỦY",
                "headline": f"Đơn hàng #{order.id} đã bị hủy",
                "intro": "Đơn hàng đã được hủy theo yêu cầu hoặc do hệ thống.",
                "note": "Nếu đây là nhầm lẫn, hãy liên hệ hotline để được hỗ trợ đặt lại.",
                "gradient": "linear-gradient(135deg,#7f1d1d,#dc2626)",
            },
        }

        config = status_configs.get(status)
        if not config:
            return None

        reservation_date_text = reservation_date or order.created_at.strftime("%d/%m/%Y")
        reservation_slot_text = reservation_slot or "Không đặt bàn"
        table_text = table_label or "Không đặt bàn"

        text_body = (
            f"Xin chào {user_name},\n\n"
            f"{config['headline']}\n"
            f"- Trạng thái: {config['badge']}\n"
            f"- Thời gian: {reservation_slot_text}\n"
            f"- Ngày: {reservation_date_text}\n"
            f"- Bàn: {table_text}\n"
            f"- Số món: {total_items}\n"
            f"- Tổng tiền: {formatted_total}\n\n"
            f"{config['intro']}\n"
            f"{config['note']}\n\n"
            "Trân trọng,\nSchool Food Order"
        )

        html_body = f"""
            <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f6fb;padding:0;margin:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.18);">
                                <tr>
                                    <td style="background:{config['gradient']};padding:32px 40px;color:white;">
                                        <div style="opacity:0.8;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">{config['badge']}</div>
                                        <h1 style="margin:8px 0 0;font-size:26px;">{config['headline']}</h1>
                                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);">
                                            Xin chào {user_name}, {config['intro']}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:32px 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                            <tr>
                                                <td style="width:50%;padding:12px 16px;background:#f8f9ff;border-radius:16px;">
                                                    <div style="font-size:12px;text-transform:uppercase;color:#6366f1;letter-spacing:0.08em;">Thời gian đặt bàn</div>
                                                    <div style="font-size:16px;font-weight:600;color:#111827;margin-top:6px;">{reservation_slot_text}</div>
                                                    <div style="color:#6b7280;margin-top:2px;">{reservation_date_text}</div>
                                                </td>
                                                <td style="width:50%;padding:12px 16px;">
                                                    <div style="font-size:12px;text-transform:uppercase;color:#6366f1;letter-spacing:0.08em;">Vị trí</div>
                                                    <div style="font-size:16px;font-weight:600;color:#111827;margin-top:6px;">{table_text}</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width:50%;padding:12px 16px;">
                                                    <div style="font-size:12px;text-transform:uppercase;color:#6366f1;letter-spacing:0.08em;">Số lượng món</div>
                                                    <div style="font-size:20px;font-weight:700;color:#111827;margin-top:6px;">{total_items}</div>
                                                </td>
                                                <td style="width:50%;padding:12px 16px;">
                                                    <div style="font-size:12px;text-transform:uppercase;color:#6366f1;letter-spacing:0.08em;">Tổng cộng</div>
                                                    <div style="font-size:20px;font-weight:700;color:#e879f9;margin-top:6px;">{formatted_total}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <div style="margin:28px 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Chi tiết món</div>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                            <thead>
                                                <tr style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">
                                                    <th align="left" style="font-weight:600;padding-bottom:8px;">Món</th>
                                                    <th align="center" style="font-weight:600;padding-bottom:8px;">Số lượng</th>
                                                    <th align="right" style="font-weight:600;padding-bottom:8px;">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items_html}
                                            </tbody>
                                        </table>
                                        <div style="margin-top:24px;font-size:14px;color:#6b7280;">
                                            {config['note']}
                                        </div>
                                        <div style="margin-top:32px;font-size:13px;color:#9ca3af;text-align:center;">
                                            Trân trọng,<br/>Đội ngũ School Food Order
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        """

        return {
            "subject": config["headline"],
            "text": text_body,
            "html": html_body,
        }

    @staticmethod
    def _sync_table_and_reservation(
        db: Session, order: Optional[Order], status: OrderStatus
    ) -> None:
        """Keep table/reservation status in sync with order state."""
        if not order or not order.table_id:
            return

        table_status = None
        reservation_status = None

        if status in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
            table_status = TableStatus.RESERVED
            reservation_status = ReservationStatus.CONFIRMED
        elif status in (OrderStatus.PREPARING, OrderStatus.READY):
            table_status = TableStatus.OCCUPIED
            reservation_status = ReservationStatus.ACTIVE
        elif status == OrderStatus.CANCELLED:
            table_status = TableStatus.AVAILABLE
            reservation_status = ReservationStatus.CANCELLED
        elif status == OrderStatus.COMPLETED:
            table_status = TableStatus.AVAILABLE
            reservation_status = ReservationStatus.COMPLETED

        if table_status:
            table_crud.update_status(db, table_id=order.table_id, status=table_status)

        if order.reservation and reservation_status:
            reservation_crud.update_status(
                db,
                reservation_id=order.reservation.id,
                status=reservation_status,
                clear_order=False,
            )

    @staticmethod
    def create_order_from_cart(
        db: Session, user_id: int, order_in: OrderCreate
    ) -> Order:
        """Create order from user's cart."""
        # Get user's cart
        cart = cart_crud.get_by_user(db, user_id=user_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )
        
        # Validate all products are still available
        for cart_item in cart.items:
            product = product_crud.get(db, id=cart_item.product_id)
            if not product or not product.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {cart_item.product_id} is no longer available",
                )
            
            # Check stock
            if product.stock_quantity is not None:
                if product.stock_quantity < cart_item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Not enough stock for {product.name}. Available: {product.stock_quantity}",
                    )
        
        # Validate table if dine-in
        reservation = None
        if order_in.table_id:
            table = table_crud.get(db, id=order_in.table_id)
            if not table:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Table not found",
                )

            # Require reservation when ordering dine-in
            if not order_in.reservation_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reservation is required for dine-in orders",
                )

            reservation = reservation_crud.get(db, id=order_in.reservation_id)
            if not reservation or reservation.table_id != order_in.table_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reservation not found for this table",
                )
            if reservation.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Reservation does not belong to current user",
                )
            if reservation.status not in (
                ReservationStatus.CONFIRMED,
                ReservationStatus.ACTIVE,
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reservation is not in a valid state",
                )
        
        # Calculate total and prepare order items
        total_amount = 0.0
        order_items = []
        
        for cart_item in cart.items:
            subtotal = cart_item.price_at_time * cart_item.quantity
            total_amount += subtotal
            
            order_items.append({
                "product_id": cart_item.product_id,
                "quantity": cart_item.quantity,
                "price_at_time": cart_item.price_at_time,
                "subtotal": subtotal,
                "notes": None,
            })
        
        # Create order
        order = order_crud.create_with_items(
            db,
            user_id=user_id,
            obj_in=order_in,
            items=order_items,
            total_amount=total_amount,
        )
        if reservation:
            reservation_crud.attach_order(db, reservation_id=reservation.id, order_id=order.id)
            table_crud.update_status(
                db, table_id=order_in.table_id, status=TableStatus.RESERVED
            )
        
        # Update stock quantities
        for cart_item in cart.items:
            product = product_crud.get(db, id=cart_item.product_id)
            if product.stock_quantity is not None:
                product.stock_quantity -= cart_item.quantity
                db.add(product)
        
        db.commit()
        
        # Reload order with relationships for notifications
        full_order = order_crud.get(db, id=order.id)

        OrderService._sync_table_and_reservation(db, full_order, OrderStatus.PENDING)

        email_payload = OrderService._build_status_email_payload(full_order, OrderStatus.PENDING)
        if email_payload:
            email_service.send_email(
                subject=email_payload["subject"],
                to_email=full_order.user.email,
                text_body=email_payload["text"],
                html_body=email_payload["html"],
            )
        
        # Clear cart
        cart_crud.clear_cart(db, cart_id=cart.id)
        
        return order

    @staticmethod
    def update_order_status(
        db: Session, order_id: int, new_status: OrderStatus
    ) -> Order:
        """Update order status with business logic."""
        order = order_crud.get(db, id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        
        # Update status
        order_crud.update_status(db, order_id=order_id, status=new_status)
        order = order_crud.get(db, id=order_id)

        OrderService._sync_table_and_reservation(db, order, new_status)
        
        email_payload = OrderService._build_status_email_payload(order, new_status)
        if email_payload:
            email_service.send_email(
                subject=email_payload["subject"],
                to_email=order.user.email,
                text_body=email_payload["text"],
                html_body=email_payload["html"],
            )
        
        # If completed, release table and update payment
        if new_status == OrderStatus.COMPLETED:
            # Auto-mark as paid when completed
            order.payment_status = PaymentStatus.PAID
            order.updated_at = datetime.utcnow()
            db.add(order)
            db.commit()
            db.refresh(order)
        
        # If cancelled, release table and restore stock
        elif new_status == OrderStatus.CANCELLED:
            # Restore stock
            for order_item in order.items:
                product = product_crud.get(db, id=order_item.product_id)
                if product and product.stock_quantity is not None:
                    product.stock_quantity += order_item.quantity
                    db.add(product)
            
            db.commit()
        
        return order_crud.get(db, id=order_id)

    @staticmethod
    def get_user_orders(
        db: Session, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        """Get orders for a specific user."""
        return order_crud.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

    @staticmethod
    def get_orders_by_status(
        db: Session, status: OrderStatus, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        """Get orders by status."""
        return order_crud.get_by_status(db, status=status, skip=skip, limit=limit)

    @staticmethod
    def calculate_order_total(order: Order) -> float:
        """Calculate total amount for order."""
        total = 0.0
        for item in order.items:
            total += item.subtotal
        return total


order_service = OrderService()
