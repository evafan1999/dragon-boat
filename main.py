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
    url = "https://densuke.biz/list?cd=a23SSfHZzRCeKetW"
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
    allow_origins=["*"],
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
async def update_members(members: List[Member]):
    try:
        conn = sqlite3.connect('mydatabase.db')
        cursor = conn.cursor()

        for member in members:
            cursor.execute(
                "UPDATE members SET side = ?, weight = ?, category = ? WHERE name = ?",
                (member.side, member.weight, member.category, member.name)
            )

        conn.commit()
        conn.close()
        return {"message": "Members updated successfully"}
    except sqlite3.Error as e:
        logger.error(f"Failed to update members: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update members")


@app.get("/api/current_members")
async def get_members():
    try:
        conn = sqlite3.connect('mydatabase.db')
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM members")
        rows = cursor.fetchall()
        conn.close()

        members = [{
            "name": row[0],
            "side": row[1],
            "weight": row[2],
            "category": row[3]
        } for row in rows]
        
        return {
            "members": members
        }
    except sqlite3.Error as e:
        logger.error(f"Failed to retrieve members: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve members")

@app.delete("/api/delete_member")
async def delete_member(name: str):
    conn = sqlite3.connect('mydatabase.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM members WHERE name = ?", (name,))
    conn.commit()
    conn.close()
    return {"message": "Member deleted"}

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
    conn = sqlite3.connect('mydatabase.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO members (name, side, weight, category) VALUES (?, ?, ?, ?)", (member.name, member.side, member.weight, member.category))
    conn.commit()
    conn.close()
    return {"message": "Member added"}

@app.get("/scrape")
async def scrape():
    scrape_data()
    return {"message": "Scraping completed"}

@app.get("/api/available_names")
async def get_available_names():
    try:
        # 爬取數據
        data = scrape_data()
        all_names = set(data['names'])  # 所有可選名字
        if not all_names:
            return {"error": "No names available"}

        # 查詢現有成員
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM members")
            existing_members = {row[0] for row in cursor.fetchall()}

        # 找出尚未新增的名字
        available_names = list(all_names - existing_members)
        return available_names
    except Exception as e:
        logger.error(f"Failed to retrieve available names: {str(e)}")
        return {"error": f"Failed to retrieve available names: {str(e)}"}
