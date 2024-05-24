# Dragon Boat Team Attendance Management System

## Introduction
The Dragon Boat Team Attendance Management System is a web application designed to manage attendance, paddle arrangement, and member details for a dragon boat team. This system allows users to select practice dates, view attendance, assign paddlers to positions, and export table data as images.

## Features
- Display attendance list for selected dates.
- Dynamically populate paddler positions based on attendance.
- Calculate and display total weights for left and right paddlers.
- Export paddler arrangement tables as images.
- Manage team member details, including side, weight, and category.
- Save and load paddler arrangement states using local storage.

## Technologies Used
- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: FastAPI
- Database: SQLite
- Web Scraping: BeautifulSoup
- Other: html2canvas for exporting tables as images

## Installation

### Prerequisites
- Python 3.x
- pip (Python package installer)

### Setup
1. **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/dragon-boat-attendance.git
    cd dragon-boat-attendance
    ```

2. **Create and activate a virtual environment**
    ```bash
    python -m venv env
    source env/bin/activate   # On Windows: env\Scripts\activate
    ```

3. **Install dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4. **Run the application**
    ```bash
    uvicorn main:app --reload
    ```

5. **Access the application**
    Open your web browser and navigate to `http://127.0.0.1:8000`

## Usage

### Main Features
1. **Select Practice Date**
    - Use the dropdown to select a date for practice.
    - Click "Show Attendance" to view the attendance list and paddler arrangement.

2. **Assign Paddlers**
    - Use the dropdowns in the "大龍" and "小龍" tables to assign paddlers to left or right positions.
    - The "其他" group includes paddlers not present in the attendance list.

3. **Calculate Weights**
    - The system automatically calculates and displays the total weights for left and right paddlers.

4. **Export Tables as Images**
    - Click "Print Big Dragon" or "Print Small Dragon" to export the respective tables as PNG images. The filenames will include the selected date and dragon type.

5. **Manage Members**
    - Navigate to the Member Management page to add, update, or delete team members.
    - Ensure member details are up-to-date for accurate attendance and paddle assignment.

### Additional Features
- **Local Storage**: The system saves the paddle arrangements in the browser's local storage, allowing you to return to previous arrangements when selecting the same date.
- **Loading Indicator**: A loading indicator is displayed while fetching data.
- **Responsive Design**: The layout is optimized for mobile use.

## Contributing
Contributions are welcome! Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgements
- Thanks to the contributors of FastAPI and Bootstrap.
- Special thanks to the dragon boat team Paddle-Zelos for their feedback and testing.

