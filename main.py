import os, sqlite3
from bs4 import BeautifulSoup
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
from starlette.staticfiles import StaticFiles

import requests

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
            return {"error": "Table not found"}
    else:
        return {"error": "Failed to fetch data"}

class Member(BaseModel):
    name: str
    side: str
    weight: float
    category: str

@app.get("/")
async def read_root():
    return FileResponse("templates/index.html")
    # return 

@app.get("/members")
async def read_root():
    return FileResponse("templates/members.html")

@app.get("/api/attendance")
async def get_attendance():
    data = scrape_data()
    return data

# 用於接收POST請求的路由
@app.post("/api/update_members")
async def update_members(member_list: List[Member]):
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect('mydatabase.db')
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

        # Commit the changes
        conn.commit()

        # Close the database connection
        conn.close()

        return {"message": "Member list updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update member list: {str(e)}")

@app.get("/api/current_members")
async def get_current_members():
    try:
        # 連接到SQLite數據庫
        conn = sqlite3.connect('mydatabase.db')
        cursor = conn.cursor()

        # 查詢所有成員
        cursor.execute("SELECT name, side, weight, category FROM members")
        members = [{"name": row[0], "side": row[1], "weight": row[2], "category": row[3]} for row in cursor.fetchall()]

        # 關閉數據庫連接
        conn.close()

        return {"members": members}
    except Exception as e:
        return {"error": f"Failed to retrieve current members: {str(e)}"}

@app.delete("/api/delete_member")
async def delete_member(name: str):
    try:
        # 連接到SQLite數據庫
        conn = sqlite3.connect('mydatabase.db')
        cursor = conn.cursor()

        # 刪除指定名稱的成員
        cursor.execute("DELETE FROM members WHERE name=?", (name,))

        # 提交更改
        conn.commit()

        # 關閉數據庫連接
        conn.close()

        return {"message": f"Member '{name}' deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete member '{name}': {str(e)}")

@app.delete("/api/clear_database")
async def clear_database():
    try:
        # 連接到 SQLite 數據庫
        conn = sqlite3.connect('mydatabase.db')
        cursor = conn.cursor()

        # 刪除整張表格
        cursor.execute("DROP TABLE IF EXISTS members")

        # 提交更改
        conn.commit()

        # 關閉數據庫連接
        conn.close()

        return {"message": "Database cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear database: {str(e)}")
