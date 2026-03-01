from db_instance import db
# יצירת מחלקת בסיס לכל המודלים עם שדה id
class BaseModel(db.Model):
    """  מחלקת בסיס אבסטרקטית.   """
    __abstract__ = True
    # שדה מזהה ייחודי (Primary Key) שקיים אוטומטית בכל טבלה שיורשת מכאן
    id = db.Column(db.Integer, primary_key=True)
    def save(self):
        """    פונקציית עזר לשמירת האובייקט במסד הנתונים.
               מוסיפה את השינויים (add) ומבצעת שמירה סופית (commit). """
        db.session.add(self)
        db.session.commit()
