from db_instance import db
# טבלה זו משמשת לחיבור בין טבלת Users לטבלת Recipes
favorites_table = db.Table('favorites',
# המזהה של המשתמש שאהב את המתכון
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
# המזהה של המתכון שנאהב
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipes.id'), primary_key=True)
)
def save(self):
        db.session.add(self)
        db.session.commit()