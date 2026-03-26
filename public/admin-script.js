
document.addEventListener('DOMContentLoaded', () => {
    // 1. Elements
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('adminLogout');

    // 1.5 Password Toggle
    const togglePassword = document.getElementById('togglePassword');
    const adminPassword = document.getElementById('adminPassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = adminPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            adminPassword.setAttribute('type', type);
        });
    }

    const navItems = document.querySelectorAll('.nav-item');
    const viewPanels = document.querySelectorAll('.view-panel');

    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statToday = document.getElementById('statToday');

    const recentTable = document.querySelector('#recentAppsTable tbody');
    const fullTable = document.querySelector('#fullAppsTable tbody');
    const appSearch = document.getElementById('appSearch');

    const detailModal = document.getElementById('detailModal');
    const detID = document.getElementById('detID');
    const detName = document.getElementById('detName');
    const detDate = document.getElementById('detDate');
    const detInfoContent = document.getElementById('detailInfoContent');
    const detDocsGrid = document.getElementById('detailDocsGrid');

    // 2. Auth State Check
    function checkAuth() {
        if (localStorage.getItem('mcc_admin_token')) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'flex';
            loadDashboard();
        } else {
            loginSection.style.display = 'flex';
            dashboardSection.style.display = 'none';
        }
    }

    // 3. Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('mcc_admin_token', data.token);
                checkAuth();
            } else {
                loginError.style.display = 'block';
            }
        } catch (err) {
            console.error(err);
            alert('Server error.');
        }
    });

    // 4. Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('mcc_admin_token');
        checkAuth();
    });

    // 5. Dashboard Logic

    function renderRecentTable(data) {
        recentTable.innerHTML = '';
        if (data.length === 0) {
            recentTable.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">No recent applications found.</td></tr>';
            return;
        }

        data.forEach(app => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${app.name_english}</td>
                <td><span class="badge-pill-ui badge-student">${app.class_registered || 'Standard'}</span></td>
                <td>${app.email || '-'}</td>
                <td>${new Date(app.created_at).toLocaleDateString()}</td>
            `;
            recentTable.appendChild(tr);
        });
    }

    function renderFullTable(data) {
        fullTable.innerHTML = '';
        if (data.length === 0) {
            fullTable.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No records found.</td></tr>';
            return;
        }

        data.forEach(app => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color: #64748b; font-size: 0.8rem;">${app.registration_no || 'Pending'}</td>
                <td>${app.name_english}</td>
                <td>${app.class_registered}</td>
                <td>${app.contact_no || '-'}</td>
                <td>${new Date(app.created_at).toLocaleDateString()}</td>
                <td><button class="btn-view" data-id="${app.id}" style="padding: 6px 14px; font-size: 0.75rem;">View</button></td>
            `;
            fullTable.appendChild(tr);
        });

        // Add Listeners to View Buttons
        fullTable.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => viewApplication(btn.dataset.id));
        });
    }

    // Updated loadDashboard to use split renderers
    async function loadDashboard() {
        try {
            const statsRes = await fetch('/api/admin/stats');
            const stats = await statsRes.json();
            statTotal.textContent = stats.total;
            statPending.textContent = stats.pending;
            statToday.textContent = stats.today;

            const appsRes = await fetch('/api/admin/applications');
            const apps = await appsRes.json();
            
            renderRecentTable(apps.slice(0, 5));
            renderFullTable(apps);

            appSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = apps.filter(app => 
                    app.name_english.toLowerCase().includes(query) || 
                    (app.registration_no && app.registration_no.toLowerCase().includes(query)) ||
                    (app.contact_no && app.contact_no.toLowerCase().includes(query))
                );
                renderFullTable(filtered);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // 6. Detailed View
    async function viewApplication(id) {
        try {
            const res = await fetch(`/api/admin/application/${id}`);
            const data = await res.json();
            
            const { student, documents, parents } = data;

            detID.textContent = student.registration_no;
            detName.textContent = student.name_english;
            detDate.textContent = `Submitted on: ${new Date(student.created_at).toLocaleString()}`;

            // Render Summary
            let summaryHTML = `
                <div class="summary-section">
                    <h4 style="color:#800000; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:5px;">STUDENT INFORMATION</h4>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; font-size:0.9rem;">
                        <div><strong>NAME:</strong> ${student.name_english} (${student.name_tamil})</div>
                        <div><strong>GENDER:</strong> ${student.gender}</div>
                        <div><strong>D.O.B:</strong> ${student.dob_day}/${student.dob_month}/${student.dob_year}</div>
                        <div><strong>AADHAAR:</strong> ${student.aadhar_no}</div>
                        <div><strong>BLOOD GROUP:</strong> ${student.blood_group}</div>
                        <div><strong>ADDRESS:</strong> ${student.address}</div>
                        <div><strong>PARENT CONTACT:</strong> ${student.contact_no}</div>
                        <div><strong>PARENT EMAIL:</strong> ${student.email}</div>
                    </div>
                </div>
            `;

            parents.forEach(p => {
                summaryHTML += `
                    <div class="summary-section" style="margin-top:30px;">
                        <h4 style="color:#800000; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:5px;">${p.relation.toUpperCase()}'S DETAILS</h4>
                        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; font-size:0.9rem;">
                            <div><strong>NAME:</strong> ${p.name}</div>
                            <div><strong>D.O.B:</strong> ${p.dob}</div>
                            <div><strong>QUALIFICATION:</strong> ${p.qualification}</div>
                            <div><strong>OCCUPATION:</strong> ${p.occupation}</div>
                            <div><strong>OFFICE:</strong> ${p.office_name}</div>
                            <div><strong>MONTHLY INCOME:</strong> ${p.monthly_income}</div>
                            <div><strong>AADHAAR:</strong> ${p.aadhar_no}</div>
                        </div>
                    </div>
                `;
            });

            detInfoContent.innerHTML = summaryHTML;

            // Render Documents
            detDocsGrid.innerHTML = '';
            documents.forEach(doc => {
                const card = document.createElement('div');
                card.innerHTML = `
                    <div style="background:#f8f9fa; border-radius:12px; padding:15px; text-align:center; border:1px solid #eee;">
                        <p style="font-size:0.7rem; font-weight:800; color:var(--text-muted); margin-bottom:10px; text-transform:uppercase;">${doc.doc_type}</p>
                        <img src="/${doc.file_path}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; cursor:pointer;" onclick="window.open('/${doc.file_path}')">
                        <a href="/${doc.file_path}" download class="btn" style="padding:4px 10px; font-size:0.7rem; margin-top:10px; display:inline-block; border:1px solid var(--maroon); color:var(--maroon);">Download Certificate</a>
                    </div>
                `;
                detDocsGrid.appendChild(card);
            });

            detailModal.style.display = 'flex';
        } catch (err) {
            console.error(err);
        }
    }

    // 7. Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (!view) return;

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            viewPanels.forEach(p => p.style.display = 'none');
            document.getElementById(view + 'View').style.display = 'block';
        });
    });

    // 8. Globals for Modal
    window.closeDetail = () => {
        detailModal.style.display = 'none';
    };

    checkAuth();
});
