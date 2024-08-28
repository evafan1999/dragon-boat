import sqlite3
import requests
import logging
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic模型
class Member(BaseModel):
    name: str
    side: str
    weight: float
    category: str

# 爬取數據
def scrape_data():
    # url = "https://densuke.biz/list?cd=zmeRuJKrVJvpQUJn#google_vignette" 五六月
    url = "https://densuke.biz/list?cd=pA9QsVcW7K9MnnY7"
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", class_="listtbl")

        if table:
            rows = table.find_all("tr", recursive=False)
            dates_list = [row.find("td").text.strip() for row in rows[1:]]
            name_list = [td.get_text(strip=True) for td in table.find("tr").find_all("td")[3:]]
            att_list = [[td_att.text.strip() for td_att in tr_att.find_all("td")[3:]] for tr_att in rows[1:]]
            
            return {"dates": dates_list, "names": name_list, "attendance": att_list}
        else:
            logger.error("Table not found on the page.")
            return {"error": "Table not found"}
    else:
        logger.error(f"Failed to fetch data from {url}. Status code: {response.status_code}")
        return {"error": "Failed to fetch data"}

# 設置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 可以設置具體的允許來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
@app.get("/")
async def read_root():
    return FileResponse("templates/index.html")

@app.get("/members")
async def read_members():
    return FileResponse("templates/members.html")

@app.get("/api/attendance")
async def get_attendance():
    data = scrape_data()
    return data

@app.post("/api/update_members")
async def update_members(member_list: List[Member]):
    try:
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''CREATE TABLE IF NOT EXISTS members
                            (name TEXT, side TEXT, weight REAL, category TEXT)''')
            
            existing_members = {row[0] for row in cursor.execute("SELECT name FROM members")}
            new_members = [member for member in member_list if member.name not in existing_members]
            
            for member in member_list:
                if member.name in existing_members:
                    cursor.execute("UPDATE members SET side=?, weight=?, category=? WHERE name=?",
                                   (member.side, member.weight, member.category, member.name))
                else:
                    cursor.executemany("INSERT INTO members (name, side, weight, category) VALUES (?, ?, ?, ?)",
                                       [(m.name, m.side, m.weight, m.category) for m in new_members])

            conn.commit()
        return {"message": "Member list updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update member list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update member list: {str(e)}")

@app.get("/api/current_members")
async def get_current_members(page: int = Query(1, ge=1), size: int = Query(15, ge=1)):
    try:
        offset = (page - 1) * size
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name, side, weight, category FROM members LIMIT ? OFFSET ?", (size, offset))
            members = [{"name": row[0], "side": row[1], "weight": row[2], "category": row[3]} for row in cursor.fetchall()]

            cursor.execute("SELECT COUNT(*) FROM members")
            total_count = cursor.fetchone()[0]

        total_pages = (total_count + size - 1) // size  # 計算總頁數
        return {
            "members": members,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": size
        }
    except Exception as e:
        logger.error(f"Failed to retrieve current members: {str(e)}")
        return {"error": f"Failed to retrieve current members: {str(e)}"}

@app.delete("/api/delete_member")
async def delete_member(name: str):
    try:
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM members WHERE name=?", (name,))
            conn.commit()
        return {"message": f"Member '{name}' deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete member '{name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete member '{name}': {str(e)}")

@app.delete("/api/clear_database")
async def clear_database():
    try:
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS members")
            conn.commit()
        return {"message": "Database cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear database: {str(e)}")
    
@app.post("/api/add_member")
async def add_member(member: Member):
    try:
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM members WHERE name=?", (member.name,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Member already exists")
            cursor.execute("INSERT INTO members (name, side, weight, category) VALUES (?, ?, ?, ?)",
                           (member.name, member.side, member.weight, member.category))
            conn.commit()
        return {"message": "New member added successfully"}
    except Exception as e:
        logger.error(f"Failed to add new member: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add new member: {str(e)}")
