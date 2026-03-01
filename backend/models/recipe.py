from db_instance import db
from models.base_model import BaseModel
import json

# טבלת מתכון
class Recipe(BaseModel):
    __tablename__ = 'recipes'
    title = db.Column(db.String(120), nullable=False)
    # שדות לשמירת נתיבים של וריאציות תמונה שונות
    image_path = db.Column(db.String)
    image_bw = db.Column(db.String(255))  # שחור-לבן
    image_rotated = db.Column(db.String(255))  # מסובבת
    image_blur = db.Column(db.String(255))# מטושטשת
    image_flip = db.Column(db.String(255))# מראה
    image_color = db.Column(db.String(255))# צבעונית
    type = db.Column(db.String)  # למשל: בשרי, חלבי, פרווה
    instructions = db.Column(db.Text)  # הוראות הכנה
    prep_time = db.Column(db.Integer)  # זמן הכנה בדקות
    # המשתמש שיצר את המתכון
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    # הקשר לטבלת הרכיבים.
    # backref='recipe' מאפשר לגשת מהרכיב חזרה למתכון.
    # lazy=True טוען את הרכיבים רק כשמבקשים אותם (חוסך זיכרון).
    ingredients = db.relationship('IngredientEntry', backref='recipe', lazy=True, cascade="all, delete-orphan")
    likes = db.Column(db.Integer, default=0)
    dislikes = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0.0)  # דירוג ממוצע (למשל 4.5)
    num_ratings = db.Column(db.Integer, default=0)  # כמה אנשים דירגו
    category = db.Column(db.String)  # עוגות, עוגיות, מנה עיקרית, קינוחים וכו',

    def to_dict(self):
        """המרה ל-JSON כולל המרה של רשימת הרכיבים בתוכו"""
        return {
            "id": self.id,
            "title": self.title,
            "image_path": self.image_path,
            "type": self.type,
            "instructions": self.instructions,
            "prep_time": self.prep_time,
            "likes": self.likes,
            "dislikes": self.dislikes,
            "rating": self.rating,
            "num_ratings": self.num_ratings,
            # כאן ההפעלה של ה-to_dict של כל רכיב ברשימה
            "ingredients": [i.to_dict() for i in self.ingredients],
            "category": self.category,
            "user_id": self.user_id

        }