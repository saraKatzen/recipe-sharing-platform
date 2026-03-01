from db_instance import db
from models.base_model import BaseModel
from models.favorites import favorites_table
# יצירת מחלקת משתמש עם שדות מתאימים
class User(BaseModel):
    __tablename__ = 'users'
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='Reader')
    is_approved_uploader = db.Column(db.Boolean, default=False)
    request_pending = db.Column(db.Boolean, default=False)
    is_approved_contributor = db.Column(db.Boolean, default=False)
    favorites = db.relationship('Recipe', secondary=favorites_table, backref='fans')
    profile_image = db.Column(db.String(255), nullable=True)
    def save(self):
        db.session.add(self)
        db.session.commit()

