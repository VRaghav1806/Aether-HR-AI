import pymongo
import sys

def test_connection(uri):
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print(f"Successfully connected to MongoDB.")
        return True
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return False

if __name__ == "__main__":
    atlas_uri = "mongodb+srv://raghavv2024aids_db_user:s8SJqfaijrmwuVDp@cluster0.r2jpdrk.mongodb.net/aether_hr"
    test_connection(atlas_uri)
