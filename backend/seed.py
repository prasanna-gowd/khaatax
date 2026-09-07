from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models import User, Group, GroupMember, Category, Transaction
from app.core.security import get_password_hash
from app.utils.code_generator import generate_group_code
from datetime import datetime, timezone, timedelta

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Check if seed already performed
        if db.query(User).filter(User.email_or_phone == "prasanna@example.com").first():
            print("Database already seeded.")
            return

        print("Seeding database...")
        # Create Users
        u1 = User(
            name="Prasanna",
            email_or_phone="prasanna@example.com",
            hashed_password=get_password_hash("password123")
        )
        u2 = User(
            name="Rahul",
            email_or_phone="rahul@example.com",
            hashed_password=get_password_hash("password123")
        )
        db.add_all([u1, u2])
        db.flush()

        # Create Categories
        cats = {
            "Food": Category(name="Food", icon="utensils"),
            "Rent": Category(name="Rent", icon="home"),
            "Electricity": Category(name="Electricity", icon="zap"),
            "Internet": Category(name="Internet", icon="wifi"),
            "Groceries": Category(name="Groceries", icon="shopping-cart"),
            "Settlement": Category(name="Settlement", icon="hand-coins"),
            "Other": Category(name="Other", icon="tag")
        }
        for c in cats.values():
            existing = db.query(Category).filter(Category.name == c.name).first()
            if not existing:
                db.add(c)
        db.flush()

        # Reload categories
        cats_db = {c.name: db.query(Category).filter(Category.name == c.name).first() for c.name in cats.keys()}

        # Create Group
        code = "KX72P9"
        group = Group(
            name="Room Expenses",
            code=code,
            owner_id=u1.id
        )
        db.add(group)
        db.flush()

        # Memberships
        m1 = GroupMember(group_id=group.id, user_id=u1.id, role="OWNER")
        m2 = GroupMember(group_id=group.id, user_id=u2.id, role="MEMBER")
        db.add_all([m1, m2])
        db.flush()

        # Sample Transactions
        t1 = Transaction(
            group_id=group.id,
            created_by=u1.id,
            paid_by=u1.id,
            amount=900.0,
            transaction_type="EXPENSE",
            description="Weekly Groceries",
            category_id=cats_db["Groceries"].id,
            split_type="50_50",
            transaction_date=datetime.now(timezone.utc) - timedelta(days=3)
        )
        t2 = Transaction(
            group_id=group.id,
            created_by=u1.id,
            paid_by=u1.id,
            amount=650.0,
            transaction_type="EXPENSE",
            description="Friday Dinner",
            category_id=cats_db["Food"].id,
            split_type="50_50",
            transaction_date=datetime.now(timezone.utc) - timedelta(days=2)
        )
        t3 = Transaction(
            group_id=group.id,
            created_by=u2.id,
            paid_by=u2.id,
            amount=1200.0,
            transaction_type="EXPENSE",
            description="Electricity Bill",
            category_id=cats_db["Electricity"].id,
            split_type="50_50",
            transaction_date=datetime.now(timezone.utc) - timedelta(days=1)
        )
        t4 = Transaction(
            group_id=group.id,
            created_by=u2.id,
            paid_by=u2.id,
            amount=800.0,
            transaction_type="EXPENSE",
            description="WiFi Monthly",
            category_id=cats_db["Internet"].id,
            split_type="50_50",
            transaction_date=datetime.now(timezone.utc)
        )
        db.add_all([t1, t2, t3, t4])
        db.commit()

        print(f"Database seeded successfully! Group Code: {code}")
        print("User 1: prasanna@example.com / password123")
        print("User 2: rahul@example.com / password123")
    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
