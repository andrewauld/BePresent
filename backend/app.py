from flask import Flask, Blueprint, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key') # Change this in production!
api = Blueprint("api", __name__)

client = MongoClient(os.environ["MONGODB_URI"])
db = client["CoreSystem"]
users_collection = db["users"]

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ").strip()
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # decoding the payload to fetch the stored details
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({"username": data['username']})
            if not current_user:
                return jsonify({'message': 'Token is invalid!'}), 404
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def generate_token(username: str):
    return jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    }, app.config['SECRET_KEY'], algorithm="HS256")

@api.post("/users/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not username or not email or not password:
        return {"message": "Missing required parameters"}, 400

    existing = users_collection.find_one(
        {"$or": [{"username": username}, {"email": email}]},
        {"_id": 1, "username": 1, "email": 1},
    )
    if existing:
        return jsonify({"message": "User already exists"}), 409

    password_hash = generate_password_hash(password)

    result = users_collection.insert_one({"username": username, "email": email, "password_hash": password_hash})

    token = generate_token(username)

    return jsonify({'token': token})

@api.post("/users/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"message": "Missing required parameters"}), 400

    user = users_collection.find_one(
        {"$or": [{"email": identifier.lower()}, {"username": identifier}]},
        {"username": 1, "email": 1, "password_hash": 1},
    )

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"message": "Invalid credentials"}), 401
    
    token = generate_token(user["username"])

    return jsonify({'token': token})

app.register_blueprint(api, url_prefix="/api/v1")
