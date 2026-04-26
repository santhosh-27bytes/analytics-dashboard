let excelData = [];
let chartInstances = {};
const metaCols = ['Student_ID', 'Name', 'Position', 'Students Avg', 'Total', 'S/N', 'Roll No'];
const colors = ['#4318ff', '#ff59a3', '#01b574', '#ffb547', '#01bee4', '#7551ff', '#ee5d50'];

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = (evt) => {
        const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
        excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        initCheckboxes();
        updateOverview();
    };
    reader.readAsArrayBuffer(e.target.files[0]);
});

function initCheckboxes() {
    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    const container = document.getElementById('subjectGrid');
    container.innerHTML = subjects.map(s => `<label><input type="checkbox" name="subCheck" value="${s}" checked> ${s}</label>`).join('');
}

function updateOverview() {
    if (!excelData.length) return;
    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    const avgs = subjects.map(s => (excelData.reduce((acc, row) => acc + (parseFloat(row[s]) || 0), 0) / excelData.length).toFixed(1));
    drawChart('overviewCanvas', document.getElementById('overviewChartType').value, subjects, [{ label: 'Average %', data: avgs, backgroundColor: colors[0], borderColor: colors[0], fill: true }]);
}

function addPeerInput() {
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'roll-input'; input.placeholder = 'Roll No';
    document.getElementById('peerInputGroup').appendChild(input);
}

function updatePeerComparison() {
    if (!excelData.length) return;
    const type = document.getElementById('peerChartType').value;
    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    const datasets = Array.from(document.querySelectorAll('.roll-input')).map((input, i) => {
        const student = excelData.find(s => String(s.Student_ID) === input.value || String(s.Roll_No) === input.value);
        return student ? { label: student.Name || input.value, data: subjects.map(sub => student[sub]), backgroundColor: colors[i % colors.length] + '44', borderColor: colors[i % colors.length], fill: true } : null;
    }).filter(d => d);
    drawChart('peerCanvas', type, subjects, datasets);
}

function analyzeSubjects() {
    if (!excelData.length) return;
    const type = document.getElementById('subChartType').value;
    const selected = Array.from(document.querySelectorAll('input[name="subCheck"]:checked')).map(cb => cb.value);
    if (!selected.length) return alert("Select subjects!");

    let metricsHTML = '';
    let topSub = { name: '', avg: 0 };

    const subjectAvgs = selected.map(sub => {
        const scores = excelData.map(row => parseFloat(row[sub]) || 0);
        const avg = (scores.reduce((a, b) => a + b, 0) / excelData.length).toFixed(1);
        const pass = ((scores.filter(s => s >= 50).length / excelData.length) * 100).toFixed(1);

        if (parseFloat(avg) > topSub.avg) topSub = { name: sub, avg: parseFloat(avg) };

        metricsHTML += `
            <div class="metric-card">
                <h3>${sub} Analysis</h3>
                <div class="metric-value"><span class="pass-text">${pass}% Pass</span> / <span class="fail-text">${(100 - pass).toFixed(1)}% Fail</span></div>
            </div>`;
        return avg;
    });

    metricsHTML = `<div class="metric-card" style="border-top-color: #ffb547"><h3>🏆 Best Performed Subject</h3><div class="metric-value">${topSub.name} (${topSub.avg}%)</div></div>` + metricsHTML;
    document.getElementById('subjectMetrics').innerHTML = metricsHTML;
    drawChart('subjectCanvas', type, selected, [{ label: 'Average Comparison', data: subjectAvgs, backgroundColor: type === 'bar' ? colors[0] : colors }]);
}

function drawChart(canvasId, type, labels, datasets) {
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
    chartInstances[canvasId] = new Chart(document.getElementById(canvasId), { type, data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
}
// ... existing code above ...

function analyzeSubjects() {
    if (!excelData.length) return;
    const type = document.getElementById('subChartType').value;
    const selected = Array.from(document.querySelectorAll('input[name="subCheck"]:checked')).map(cb => cb.value);
    
    let metricsHTML = '';
    let topSub = { name: '', avg: 0 };

    selected.forEach(sub => {
        const scores = excelData.map(row => parseFloat(row[sub]) || 0);
        const avg = (scores.reduce((a, b) => a + b, 0) / excelData.length).toFixed(1);
        const pass = ((scores.filter(s => s >= 50).length / excelData.length) * 100).toFixed(1);

        if (parseFloat(avg) > topSub.avg) topSub = { name: sub, avg: parseFloat(avg) };

        // We add onclick events to the pass/fail texts
        metricsHTML += `
            <div class="metric-card">
                <h3>${sub} Analysis</h3>
                <div class="metric-value">
                    <span class="pass-text" onclick="viewStudents('${sub}', 'pass')">${pass}% Pass</span> / 
                    <span class="fail-text" onclick="viewStudents('${sub}', 'fail')">${(100 - pass).toFixed(1)}% Fail</span>
                </div>
                <small style="color:#a3aed0">Click text to view students</small>
            </div>`;
    });

    metricsHTML = `<div class="metric-card" style="border-top-color: #ffb547"><h3>🏆 Best Subject</h3><div class="metric-value">${topSub.name}</div></div>` + metricsHTML;
    document.getElementById('subjectMetrics').innerHTML = metricsHTML;
    
    // Draw chart (keep existing drawChart call)
    const subjectAvgs = selected.map(sub => (excelData.reduce((a,b) => a + (parseFloat(b[sub])||0), 0) / excelData.length).toFixed(1));
    drawChart('subjectCanvas', type, selected, [{ label: 'Average', data: subjectAvgs, backgroundColor: colors }]);
}

// NEW FUNCTIONS FOR MODAL
function viewStudents(subject, status) {
    const title = status === 'pass' ? `Passed in ${subject}` : `Failed in ${subject}`;
    document.getElementById('modalTitle').innerText = title;
    
    const list = excelData.filter(row => {
        const score = parseFloat(row[subject]) || 0;
        return status === 'pass' ? score >= 50 : score < 50;
    });

    const listContainer = document.getElementById('studentList');
    listContainer.innerHTML = list.map(s => `
        <div class="student-item">
            <span>${s.Name || s.Student_ID}</span>
            <span style="font-weight:bold; color:${status === 'pass' ? '#01b574' : '#ee5d50'}">${s[subject]}</span>
        </div>
    `).join('') || '<p>No students found.</p>';

    document.getElementById('studentModal').style.display = "block";
}

function closeModal() {
    document.getElementById('studentModal').style.display = "none";
}

// Close modal if user clicks outside of it
window.onclick = function(event) {
    const modal = document.getElementById('studentModal');
    if (event.target == modal) modal.style.display = "none";
}
// Helper function to calculate color from Green (100) to Red (0)
function getColor(value) {
    // value is expected to be 0-100
    const hue = (value * 1.2); // 120 is green, 0 is red
    return `hsl(${hue}, 100%, 45%)`;
}

function updateOverview() {
    if (!excelData.length) return;
    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    const avgs = subjects.map(s => (excelData.reduce((acc, row) => acc + (parseFloat(row[s]) || 0), 0) / excelData.length).toFixed(1));
    
    // Create an array of colors based on the average value
    const barColors = avgs.map(v => getColor(parseFloat(v)));

    drawChart('overviewCanvas', document.getElementById('overviewChartType').value, subjects, [{ 
        label: 'Average %', 
        data: avgs, 
        backgroundColor: barColors, // Dynamic colors applied here
        borderColor: barColors,
        borderWidth: 1
    }]);
}

function analyzeSubjects() {
    if (!excelData.length) return;
    const type = document.getElementById('subChartType').value;
    const selected = Array.from(document.querySelectorAll('input[name="subCheck"]:checked')).map(cb => cb.value);
    if (!selected.length) return alert("Select subjects!");

    let metricsHTML = '';
    let topSub = { name: '', avg: 0 };

    const subjectAvgs = selected.map(sub => {
        const scores = excelData.map(row => parseFloat(row[sub]) || 0);
        const avg = (scores.reduce((a, b) => a + b, 0) / excelData.length).toFixed(1);
        const pass = ((scores.filter(s => s >= 50).length / excelData.length) * 100).toFixed(1);

        if (parseFloat(avg) > topSub.avg) topSub = { name: sub, avg: parseFloat(avg) };

        metricsHTML += `
            <div class="metric-card">
                <h3>${sub} Analysis</h3>
                <div class="metric-value">
                    <span class="pass-text" onclick="viewStudents('${sub}', 'pass')">${pass}% Pass</span> / 
                    <span class="fail-text" onclick="viewStudents('${sub}', 'fail')">${(100 - pass).toFixed(1)}% Fail</span>
                </div>
            </div>`;
        return avg;
    });

    // Create dynamic colors for the subject comparison chart
    const barColors = subjectAvgs.map(v => getColor(parseFloat(v)));

    metricsHTML = `<div class="metric-card" style="border-top-color: #ffb547"><h3>🏆 Best Performed Subject</h3><div class="metric-value">${topSub.name} (${topSub.avg}%)</div></div>` + metricsHTML;
    document.getElementById('subjectMetrics').innerHTML = metricsHTML;
    
    drawChart('subjectCanvas', type, selected, [{ 
        label: 'Average Comparison', 
        data: subjectAvgs, 
        backgroundColor: barColors 
    }]);
}
// Update switchPage to trigger result generation when the page is opened
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');

    if (pageId === 'results') {
        generateResults();
    }
}

function generateResults() {
    if (!excelData.length) return;

    const tbody = document.getElementById('resultsBody');
    
    // 1. Sort students by Total or Students Avg (Descending)
    const sortedData = [...excelData].sort((a, b) => {
        const scoreA = parseFloat(a['Total']) || parseFloat(a['Students Avg']) || 0;
        const scoreB = parseFloat(b['Total']) || parseFloat(b['Students Avg']) || 0;
        return scoreB - scoreA;
    });

    // 2. Render Rows
    tbody.innerHTML = sortedData.map((student, index) => {
        const totalScore = student['Total'] || student['Students Avg'] || 'N/A';
        
        // Determine Pass/Fail (Assume 50% average is passing)
        const avg = parseFloat(student['Students Avg']) || (parseFloat(student['Total']) / 10) || 0;
        const statusClass = avg >= 50 ? 'status-pass' : 'status-fail';
        const statusText = avg >= 50 ? 'PASSED' : 'FAILED';

        return `
            <tr>
                <td><span class="rank-badge">#${index + 1}</span></td>
                <td>${student['Roll No'] || student['Roll_No'] || student['Student_ID']}</td>
                <td>${student['Name'] || 'Unknown'}</td>
                <td>${totalScore}</td>
                <td><span class="status-pill ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// Optional: Print Function
function exportResults() {
    window.print();
}
// Add this to your switchPage function
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Logic to update UI
    if (event) event.currentTarget.classList.add('active');
    
    // Generate results when clicking the results page
    if (pageId === 'results') generateRankings();
}

function generateRankings() {
    if (!excelData.length) return;

    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    const tbody = document.getElementById('resultsBody');

    // 1. Calculate percentage for every student
    const processedData = excelData.map(student => {
        let totalMarks = 0;
        subjects.forEach(sub => totalMarks += (parseFloat(student[sub]) || 0));
        const percentage = (totalMarks / subjects.length).toFixed(1);
        
        return {
            ...student,
            finalPercentage: parseFloat(percentage),
            roll: student['Roll No'] || student['Roll_No'] || student['Student_ID'] || 'N/A'
        };
    });

    // 2. Sort by Percentage (Highest to Lowest)
    processedData.sort((a, b) => b.finalPercentage - a.finalPercentage);

    // 3. Render Table Rows
    tbody.innerHTML = processedData.map((student, index) => {
        const isPass = student.finalPercentage >= 50;
        
        return `
            <tr>
                <td><span class="rank-circle">${index + 1}</span></td>
                <td>${student.roll}</td>
                <td>${student.Name || 'Unknown Student'}</td>
                <td>${student.finalPercentage}%</td>
                <td>
                    <span class="status-pill ${isPass ? 'status-pass' : 'status-fail'}">
                        ${isPass ? 'PASSED' : 'FAILED'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}
function generateRankings() {
    if (!excelData.length) return;

    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    const passBody = document.getElementById('passBody');
    const failBody = document.getElementById('failBody');

    // 1. Process Data & Calculate Percentage
    const processed = excelData.map(student => {
        let sum = 0;
        subjects.forEach(sub => sum += (parseFloat(student[sub]) || 0));
        const perc = (sum / subjects.length).toFixed(1);
        return {
            ...student,
            perc: parseFloat(perc),
            roll: student['Roll No'] || student['Roll_No'] || student['Student_ID'] || 'N/A'
        };
    });

    // 2. Sort all students by percentage first (to establish overall rank)
    processed.sort((a, b) => b.perc - a.perc);

    // 3. Separate into Pass and Fail groups
    const passList = processed.filter(s => s.perc >= 50);
    const failList = processed.filter(s => s.perc < 50);

    // 4. Helper function to render table rows
    const renderRows = (data, container) => {
        container.innerHTML = data.map((s, index) => `
            <tr>
                <td><span class="rank-badge">${index + 1}</span></td>
                <td>${s.roll}</td>
                <td>${s.Name || 'Unknown'}</td>
                <td>${s.perc}%</td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center;">No records found</td></tr>';
    };

    // 5. Execute Render
    renderRows(passList, passBody);
    renderRows(failList, failBody);
}
// 1. Convert Letter Grade to Points (for Charting/Ranking)
function convertGradeToPoints(value) {
    if (value === undefined || value === null || value === "") return 0;
    if (!isNaN(value)) return parseFloat(value); // If it's a number, keep it
    
    const gradeMap = {
        'O': 95,    // 90-100
        'A+': 85,   // 80-89
        'A': 75,    // 70-79
        'B+': 65,   // 60-69
        'B': 55,    // 50-59
        'C': 45,    // 40-49
        'U': 0,     // Fail
        'UE': 0     // Fail
    };
    
    return gradeMap[value.toUpperCase().trim()] || 0;
}

// 2. Convert Points back to Grade (for Result Table Display)
function getGradeFromMark(mark) {
    if (mark >= 90) return 'O';
    if (mark >= 80) return 'A+';
    if (mark >= 70) return 'A';
    if (mark >= 60) return 'B+';
    if (mark >= 50) return 'B';
    if (mark >= 40) return 'C';
    return 'U'; // Default Fail
}

// 3. Updated Ranking Function
function generateRankings() {
    if (!excelData.length) return;
    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    
    const processed = excelData.map(s => {
        let sum = 0;
        subjects.forEach(sub => {
            sum += convertGradeToPoints(s[sub]);
        });
        const avg = (sum / subjects.length).toFixed(1);
        const letterGrade = getGradeFromMark(avg);
        
        // Passing is defined as Grade C or better (40 points +)
        const isPassed = (letterGrade !== 'U' && letterGrade !== 'UE');

        return { 
            ...s, 
            perc: parseFloat(avg), 
            finalGrade: letterGrade,
            status: isPassed ? 'PASSED' : 'FAILED',
            roll: s['Roll No'] || s['Roll_No'] || s['Student_ID'] || 'N/A' 
        };
    }).sort((a, b) => b.perc - a.perc);

    document.getElementById('resultsBody').innerHTML = processed.map((s, i) => `
        <tr>
            <td><span class="rank-circle">${i+1}</span></td>
            <td>${s.roll}</td>
            <td>${s.Name || 'N/A'}</td>
            <td>${s.perc}% (${s.finalGrade})</td> 
            <td>
                <span class="status-pill ${s.status === 'PASSED' ? 'status-pass' : 'status-fail'}">
                    ${s.status}
                </span>
            </td>
        </tr>`).join('');
}
function generateResults() {
    if (!excelData || excelData.length === 0) return;

    const filter = document.getElementById('resultSubjectFilter');
    const selectedSubject = filter ? filter.value : 'overall';
    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));
    
    const processed = excelData.map(s => {
        let scoreValue = 0;
        let gradeLetter = "";

        if (selectedSubject === 'overall') {
            // Calculate Average for Overall Ranking
            let totalPoints = 0;
            subjects.forEach(sub => totalPoints += convertGradeToPoints(s[sub]));
            scoreValue = (totalPoints / subjects.length).toFixed(1);
            gradeLetter = getGradeFromMark(scoreValue);
        } else {
            // Rank by specific Subject
            const rawValue = s[selectedSubject];
            scoreValue = convertGradeToPoints(rawValue);
            gradeLetter = isNaN(rawValue) ? rawValue.toUpperCase() : getGradeFromMark(scoreValue);
        }

        return {
            ...s,
            finalScore: parseFloat(scoreValue),
            finalGrade: gradeLetter,
            // Status logic: U and UE are FAILED
            status: (gradeLetter !== 'U' && gradeLetter !== 'UE') ? 'PASSED' : 'FAILED',
            roll: s['Roll No'] || s['Roll_No'] || s['Student_ID'] || 'N/A'
        };
    });

    // Sort: Highest score at the top
    processed.sort((a, b) => b.finalScore - a.finalScore);

    // Render Table
    document.getElementById('resultsBody').innerHTML = processed.map((s, i) => `
        <tr>
            <td><span class="rank-circle">${i + 1}</span></td>
            <td>${s.roll}</td>
            <td>${s.Name || 'N/A'}</td>
            <td>${s.finalScore}% (${s.finalGrade})</td>
            <td>
                <span class="status-pill ${s.status === 'PASSED' ? 'status-pass' : 'status-fail'}">
                    ${s.status}
                </span>
            </td>
        </tr>
    `).join('');
}
/* Generate Result Table */
function generateResults() {
    if (!excelData.length) return;

    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));

    const processed = excelData.map(student => {
        let total = 0;

        subjects.forEach(sub => {
            total += convertGradeToPoints(student[sub]);
        });

        const percentage = total / subjects.length;

        return {
            name: student.Name || 'N/A',
            roll: student.roll,
            percentage: percentage,
            status: percentage >= 50 ? 'PASSED' : 'FAILED'
        };
    });

    // Sort by percentage (descending)
    processed.sort((a, b) => b.percentage - a.percentage);

    // Render table
    document.getElementById('resultsBody').innerHTML = processed.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${s.roll}</td>
            <td>${s.name}</td>
            <td>${s.percentage.toFixed(1)}%</td>
            <td class="${s.status === 'PASSED' ? 'pass' : 'fail'}">
                ${s.status}
            </td>
        </tr>
    `).join('');
}
function loadStudentReport() {
    if (!excelData.length) {
        alert("Upload file first!");
        return;
    }

    const query = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!query) {
        alert("Enter Roll No or Name");
        return;
    }

    // DEBUG
    console.log("Searching:", query);

    const student = excelData.find(s => {
        const roll = (s.roll || "").toLowerCase();
        const name = (s.name || "").toLowerCase();

        return roll.includes(query) || name.includes(query);
    });

    console.log("Found:", student);

    if (!student) {
        document.getElementById('studentDetails').innerHTML =
            "<p style='color:red;'>Student not found</p>";
        return;
    }

    const subjects = Object.keys(student).filter(k =>
        !metaCols.includes(k) &&
        k !== 'roll' &&
        k !== 'name'
    );

    let total = 0;

    const rows = subjects.map(sub => {
        const mark = convertGradeToPoints(student[sub]);
        total += mark;

        return `
            <tr>
                <td>${sub}</td>
                <td>${student[sub]}</td>
            </tr>
        `;
    }).join('');

    const percentage = (total / subjects.length).toFixed(1);
    const status = percentage >= 50 ? "PASSED" : "FAILED";

    document.getElementById('studentDetails').innerHTML = `
        <div class="report-card">
            <h3>${student.name}</h3>
            <p><b>Roll No:</b> ${student.roll}</p>

            <table class="report-table">
                ${rows}
            </table>

            <p><b>Percentage:</b> ${percentage}%</p>
            <p><b>Status:</b> ${status}</p>
        </div>
    `;
}
function initIndividualSubjects() {
    if (!excelData.length) return;

    const subjects = Object.keys(excelData[0]).filter(k => !metaCols.includes(k));

    const container = document.getElementById('individualSubjects');

    container.innerHTML = subjects.map(sub => `
        <label>
            <input type="checkbox" value="${sub}" checked> ${sub}
        </label>
    `).join('');
}
function loadStudentReport() {
    const query = document.getElementById('searchInput').value.toLowerCase();

    const student = excelData.find(s =>
        s.name.toLowerCase().includes(query) ||
        s.roll.toLowerCase().includes(query)
    );

    if (!student) {
        document.getElementById('studentDetails').innerHTML = "❌ Not found";
        return;
    }

    renderReport(student);
}

// CLICK FROM TABLE
function showReportByRoll(roll) {
    const student = excelData.find(s => s.roll === roll);
    if (student) renderReport(student);
}

// ---------------- REPORT ----------------
function renderReport(student) {

    const subjects = Object.keys(student).filter(k =>
        !metaCols.includes(k) && k !== 'name' && k !== 'roll'
    );

    let total = 0;

    const rows = subjects.map(sub => {
        const mark = parseFloat(student[sub]) || 0;
        total += mark;
        return `<tr><td>${sub}</td><td>${mark}</td></tr>`;
    }).join('');

    const percentage = (total / subjects.length).toFixed(1);

    document.getElementById('studentDetails').innerHTML = `
        <div class="report-card">
            <h3>${student.name}</h3>
            <p><b>Roll No:</b> ${student.roll}</p>

            <table>
                <tr><th>Subject</th><th>Marks</th></tr>
                ${rows}
            </table>

            <p><b>Percentage:</b> ${percentage}%</p>
            <p><b>Status:</b> ${percentage >= 50 ? 'PASSED' : 'FAILED'}</p>
        </div>
    `;
}
// Ensure this is the same variable your file loader uses
// excelData = XLSX.utils.sheet_to_json(...)

function loadStudentReport() {
    const searchInput = document.getElementById('searchInput');
    const searchVal = searchInput.value.trim().toLowerCase();
    const reportBox = document.getElementById('studentDetails');
    const tableBody = document.getElementById('reportTableBody');

    if (!excelData || excelData.length === 0) {
        alert("Please upload a file first!");
        return;
    }

    // SEARCH: Looks for a match in any column (ID, Name, or Roll)
    const student = excelData.find(s => 
        Object.values(s).some(val => String(val).toLowerCase() === searchVal)
    );

    if (student) {
        // Find Display Keys (Handling your specific Excel headers)
        const nameKey = Object.keys(student).find(k => k.toLowerCase().includes('name')) || 'Name';
        const idKey = Object.keys(student).find(k => k.toLowerCase().includes('id')) || 'Student_ID';
        const rollKey = Object.keys(student).find(k => k.toLowerCase().includes('roll')) || 'Roll No';

        document.getElementById('resName').innerText = student[nameKey] || "N/A";
        document.getElementById('resID').innerText = student[idKey] || "N/A";
        document.getElementById('resRoll').innerText = student[rollKey] || "N/A";

        tableBody.innerHTML = "";
        
        // Loop through everything that isn't a "Meta" column to find subjects
        for (let key in student) {
            const isMeta = metaCols.some(col => key.includes(col)) || 
                           ['roll', 'name', 'id'].some(m => key.toLowerCase().includes(m));
            
            if (!isMeta) {
                const rawValue = student[key];
                // Use your existing grade mapping logic
                const score = convertGradeToPoints(rawValue); 
                const grade = isNaN(rawValue) ? rawValue.toUpperCase() : getGradeFromMark(score);
                const gradeClass = grade.toLowerCase().replace('+', 'plus').replace('/', '');

                tableBody.innerHTML += `
                    <tr>
                        <td>${key}</td>
                        <td>100</td>
                        <td>${rawValue}</td>
                        <td><span class="grade-badge ${gradeClass}">${grade}</span></td>
                    </tr>`;
            }
        }
        reportBox.style.display = "block";
    } else {
        alert("Student '" + searchVal + "' not found in current records.");
    }
}
function drawChart(canvasId, type, labels, datasets) {
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(document.getElementById(canvasId), {
        type,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}