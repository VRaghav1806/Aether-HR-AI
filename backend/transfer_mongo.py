import pymongo
import sys

def transfer_data(local_uri, atlas_uri, db_name):
    try:
        local_client = pymongo.MongoClient(local_uri)
        atlas_client = pymongo.MongoClient(atlas_uri)
        
        local_db = local_client[db_name]
        atlas_db = atlas_client[db_name]
        
        collections = local_db.list_collection_names()
        print(f"Found collections in local DB '{db_name}': {collections}")
        
        for coll_name in collections:
            print(f"Transferring collection: {coll_name}...")
            # Get documents from local
            documents = list(local_db[coll_name].find())
            if not documents:
                print(f"Collection {coll_name} is empty. Skipping.")
                continue
            
            # Insert into Atlas (using insert_many)
            # Atlas will auto-create the collection if it doesn't exist
            try:
                atlas_db[coll_name].insert_many(documents, ordered=False)
                print(f"Successfully transferred {len(documents)} documents for {coll_name}.")
            except pymongo.errors.BulkWriteError as e:
                # This might happen if documents already exist (duplicate _id)
                print(f"BulkWriteError for {coll_name}: {e.details}")
            except Exception as e:
                print(f"Error transferring {coll_name}: {e}")
        
        print("\nData transfer complete.")
        return True
    except Exception as e:
        print(f"Critical Error during transfer: {e}")
        return False

if __name__ == "__main__":
    local_uri = "mongodb://localhost:27017/"
    atlas_uri = "mongodb+srv://raghavv2024aids_db_user:s8SJqfaijrmwuVDp@cluster0.r2jpdrk.mongodb.net/aether_hr"
    db_name = "aether_hr"
    
    transfer_data(local_uri, atlas_uri, db_name)
