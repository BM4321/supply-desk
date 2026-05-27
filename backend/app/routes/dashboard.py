from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.invoice import Invoice, InvoiceItem
from app.models.client import Client
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def invoice_filter(q, user: User):
    if user.role != "admin":
        q = q.filter(Invoice.created_by_id == user.id)
    return q

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year

    # All invoices visible to user
    all_inv = invoice_filter(db.query(Invoice), current_user).all()

    def calc_total(inv):
        subtotal = sum(i.quantity * i.unit_price for i in inv.items)
        discount_amt = subtotal * (inv.discount / 100)
        after_discount = subtotal - discount_amt
        tax_amt = after_discount * (inv.tax / 100)
        return after_discount + tax_amt

    def calc_cost(inv):
        return sum(i.quantity * i.cost_price for i in inv.items)

    # Revenue: paid invoices
    paid = [i for i in all_inv if i.status == "paid"]
    total_revenue = sum(calc_total(i) for i in paid)
    total_cost = sum(calc_cost(i) for i in paid)
    total_profit = total_revenue - total_cost

    # This month paid
    month_paid = [i for i in paid if i.issue_date.month == current_month and i.issue_date.year == current_year]
    month_revenue = sum(calc_total(i) for i in month_paid)

    # Outstanding (sent + overdue)
    outstanding_inv = [i for i in all_inv if i.status in ("sent", "overdue")]
    outstanding_amount = sum(calc_total(i) for i in outstanding_inv)

    # Counts
    total_clients = db.query(Client)
    if current_user.role != "admin":
        total_clients = total_clients.filter(Client.created_by_id == current_user.id)
    client_count = total_clients.count()

    # Status breakdown
    status_counts = {"draft": 0, "sent": 0, "paid": 0, "overdue": 0}
    for i in all_inv:
        if i.status in status_counts:
            status_counts[i.status] += 1

    # Monthly revenue (last 6 months)
    monthly = []
    for offset in range(5, -1, -1):
        m = (current_month - offset - 1) % 12 + 1
        y = current_year if current_month - offset > 0 else current_year - 1
        label = date(y, m, 1).strftime("%b")
        m_paid = [i for i in paid if i.issue_date.month == m and i.issue_date.year == y]
        monthly.append({
            "month": label,
            "revenue": round(sum(calc_total(i) for i in m_paid), 2),
            "cost": round(sum(calc_cost(i) for i in m_paid), 2),
            "profit": round(sum(calc_total(i) - calc_cost(i) for i in m_paid), 2),
        })

    # Top clients by revenue
    client_revenue = {}
    for i in paid:
        cid = i.client_id
        name = i.client.name if i.client else "Unknown"
        client_revenue[cid] = client_revenue.get(cid, {"name": name, "revenue": 0, "count": 0})
        client_revenue[cid]["revenue"] += calc_total(i)
        client_revenue[cid]["count"] += 1
    top_clients = sorted(client_revenue.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    for c in top_clients:
        c["revenue"] = round(c["revenue"], 2)

    # Recent invoices (last 5)
    recent = sorted(all_inv, key=lambda i: i.created_at, reverse=True)[:5]
    recent_list = []
    for i in recent:
        recent_list.append({
            "id": i.id,
            "invoice_number": i.invoice_number,
            "client_name": i.client.name if i.client else "Unknown",
            "status": i.status,
            "total": round(calc_total(i), 2),
            "created_at": i.created_at.isoformat(),
        })

    return {
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "total_profit": round(total_profit, 2),
            "month_revenue": round(month_revenue, 2),
            "outstanding_amount": round(outstanding_amount, 2),
            "outstanding_count": len(outstanding_inv),
            "client_count": client_count,
            "invoice_count": len(all_inv),
        },
        "status_counts": status_counts,
        "monthly": monthly,
        "top_clients": top_clients,
        "recent_invoices": recent_list,
    }
