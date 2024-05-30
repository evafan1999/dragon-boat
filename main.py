import os, sqlite3
from bs4 import BeautifulSoup
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import requests
import logging

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

def scrape_data():
    url = "https://densuke.biz/list?cd=zmeRuJKrVJvpQUJn#google_vignette"
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", class_="listtbl")

        if table:
            rows = table.find_all("tr", recursive=False)

            # 取得日期和大名單
            dates_list = []
            name_list = []
            att_list = []
            for row in rows[1:]:
                dates_list.append(row.find("td").text.strip())
                
            # 取得大名單
            first_tr = table.find("tr")
            if first_tr:    
                tds = first_tr.find_all("td")[3:]
                for td in tds:
                    name_list.append(td.get_text(strip=True))
            
            # 取得出席與否
            trs_att = table.find_all("tr")
            for tr_att in trs_att[1:]:
                tds_att = tr_att.find_all("td")
                row_att = [td_att.text.strip() for td_att in tds_att[3:]]
                att_list.append(row_att)
            
            return {"dates": dates_list, "names": name_list, "attendance": att_list}
        else:
            logger.error("Table not found on the page.")
            return {"error": "Table not found"}
    else:
        logger.error(f"Failed to fetch data from {url}. Status code: {response.status_code}")
        return {"error": "Failed to fetch data"}

class Member(BaseModel):
    name: str
    side: str
    weight: float
    category: str

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
        # Connect to the SQLite database
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()

            # Create the members table if it doesn't exist
            cursor.execute('''CREATE TABLE IF NOT EXISTS members
                            (name TEXT, side TEXT, weight REAL, category TEXT)''')

            # Check if each member already exists in the database
            existing_members = {row[0] for row in cursor.execute("SELECT name FROM members")}
            new_members = []
            for member in member_list:
                if member.name in existing_members:
                    # Update the existing member
                    cursor.execute("UPDATE members SET side=?, weight=?, category=? WHERE name=?",
                                (member.side, member.weight, member.category, member.name))
                else:
                    # Add the new member
                    new_members.append(member)

            # Insert new members into the database
            cursor.executemany("INSERT INTO members (name, side, weight, category) VALUES (?, ?, ?, ?)",
                                [(m.name, m.side, m.weight, m.category) for m in new_members])

            conn.commit()

        return {"message": "Member list updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update member list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update member list: {str(e)}")

@app.get("/api/current_members")
async def get_current_members():
    try:
        # 連接到SQLite數據庫
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()

            # 查詢所有成員
            cursor.execute("SELECT name, side, weight, category FROM members")
            members = [{"name": row[0], "side": row[1], "weight": row[2], "category": row[3]} for row in cursor.fetchall()]

        return {"members": members}
    except Exception as e:
        logger.error(f"Failed to retrieve current members: {str(e)}")
        return {"error": f"Failed to retrieve current members: {str(e)}"}

@app.delete("/api/delete_member")
async def delete_member(name: str):
    try:
        # 連接到SQLite數據庫
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()

            # 刪除指定名稱的成員
            cursor.execute("DELETE FROM members WHERE name=?", (name,))

            conn.commit()

        return {"message": f"Member '{name}' deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete member '{name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete member '{name}': {str(e)}")

@app.delete("/api/clear_database")
async def clear_database():
    try:
        # 連接到 SQLite 數據庫
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()

            # 刪除整張表格
            cursor.execute("DROP TABLE IF EXISTS members")

            conn.commit()

        return {"message": "Database cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear database: {str(e)}")
    
@app.post("/api/add_member")
async def add_member(member: Member):
    try:
        # 連接到SQLite數據庫
        with sqlite3.connect('mydatabase.db') as conn:
            cursor = conn.cursor()

            # 檢查成員是否已存在
            cursor.execute("SELECT * FROM members WHERE name=?", (member.name,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Member already exists")

            # 添加新成員
            cursor.execute("INSERT INTO members (name, side, weight, category) VALUES (?, ?, ?, ?)",
                            (member.name, member.side, member.weight, member.category))
            conn.commit()

        return {"message": "New member added successfully"}
    except Exception as e:
        logger.error(f"Failed to add new member: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add new member: {str(e)}")
