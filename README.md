# 🍲 Recipe Sharing Platform

A full-stack web application for collaborative recipe sharing, built with Flask and Angular.

This platform enables users to discover, upload, and manage recipes through a role-based permission system and an advanced ingredient matching algorithm.

---

## 🚀 Project Overview

The system supports multiple user roles (Reader, Uploader, Admin) and provides a structured environment for recipe management, approval workflows, and dynamic filtering.

The backend follows an ORM approach using SQLAlchemy, with clean model inheritance and object-oriented design.

---

## 🛠 Tech Stack

**Backend**

* Python 3.13
* Flask
* SQLAlchemy (ORM)
* SQLite
* Pillow (image processing)

**Frontend**

* Angular
* TypeScript
* Component-based architecture
* Dynamic filtering & sorting

---

## ✨ Key Features

### 🔍 Smart Ingredient Matching Algorithm

Users can enter the ingredients they have at home.
The server calculates a match score for each recipe using Python sets (intersection logic) and ranks recipes by relevance.

Matching score is calculated as:

```
(number of matching ingredients) / (total required ingredients)
```

Recipes are filtered and sorted server-side before being returned to Angular.

---

### 🖼 Advanced Image Processing

When a recipe image is uploaded:

* The original image is saved
* Three additional variations are generated automatically using Pillow:

  * Black & White
  * Rotated
  * Cropped / Modified effect
* Image paths are stored in the database as structured data (JSON/string)

This creates a dynamic image gallery per recipe.

---

### 👥 Role-Based Access Control

The system includes:

* **Reader** – browse, search, and rate recipes
* **Uploader** – add new recipes (after admin approval)
* **Admin** – approve uploaders, delete recipes, manage users

Server-side decorators enforce permissions for protected routes.

---

### 🗂 Database Architecture

ORM-based models include:

* `BaseModel` (with shared ID & save logic)
* `User` (roles, password, approval status)
* `Recipe` (metadata, image paths, type)
* `IngredientEntry` (One-to-Many relationship with Recipe)

Relational integrity is handled via SQLAlchemy.

---

## 🧠 Backend Concepts Implemented

* Object-Oriented Programming
* Model inheritance
* RESTful API structure
* Role validation decorators
* Image storage organization
* JSON-based field persistence
* Algorithmic ranking system

---

## ▶ How to Run

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
py -3.13 app.py
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

---

## 🎯 Project Goals

This project demonstrates:

* Full Stack architecture
* Backend logic beyond CRUD
* Algorithmic thinking
* Structured database modeling
* Permission management
* File handling & image processing
