from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class Holding(Base):
    __tablename__ = "holdings"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(10), nullable=False)  # fund / stock
    shares = Column(Float, default=0)
    cost_price = Column(Float, default=0)
    current_price = Column(Float, default=0)
    # DCA fields
    dca_enabled = Column(Boolean, default=False)
    dca_frequency = Column(String(20), nullable=True)  # daily / weekly / biweekly / monthly
    dca_amount = Column(Float, default=0)
    dca_day = Column(Integer, default=1)  # day of week (1-5) or day of month (1-28)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class WatchItem(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(10), nullable=False)
    status = Column(String(20), default="observing")  # observing / verified / expired
    entry_price = Column(Float, default=0)
    current_price = Column(Float, default=0)
    predicted_price = Column(Float, default=0)
    actual_result = Column(Float, nullable=True)
    added_at = Column(DateTime, server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(10), nullable=False)
    condition = Column(String(50), nullable=False)  # above / below / change_pct
    target_value = Column(Float, nullable=False)
    action_type = Column(String(50), default="notify")  # notify / buy / sell
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class SkillRecord(Base):
    __tablename__ = "skill_records"
    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), nullable=False)
    sub_skill = Column(String(100), nullable=True)
    tokens_used = Column(Integer, default=0)
    cost = Column(Float, default=0)
    called_at = Column(DateTime, server_default=func.now())