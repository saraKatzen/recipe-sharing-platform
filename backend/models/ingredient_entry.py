from db_instance import db
from models.base_model import BaseModel
# יצירת מחלקת רכיב מתכון עם שדות מתאימים
class IngredientEntry(BaseModel):
    __tablename__ = 'ingredient_entries'
    # המפתח הזר שמקשר את הרכיב למתכון הספציפי אליו הוא שייך
    recipe_id = db.Column(db.Integer, db.ForeignKey("recipes.id"), nullable=False)
    product = db.Column(db.String, nullable=False)#מוצר
    amount = db.Column(db.Float)#כמות
    unit = db.Column(db.String)#יחידה

#פונקציה הממירה את האובייקט למילון (JSON)
    def to_dict(self):
        return {
            "product": self.product,
            "amount": self.amount,
            "unit": self.unit
        }
