
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

    const recentTable = document.getElementById('dashboardTableBody');
    const fullTable = document.getElementById('fullTableBody');
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
                <td style="text-align: right;"><button class="btn-view" data-id="${app.id}">View</button></td>
            `;
            recentTable.appendChild(tr);
        });

        recentTable.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => viewApplication(btn.dataset.id));
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
                <td><button class="btn-view" data-id="${app.id}">View</button></td>
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
            
            // Safe updates: only set if element exists
            const elTotal = document.getElementById('statTotal');
            const elPending = document.getElementById('statPending');
            const elStaff = document.getElementById('statStaff');
            const elCerts = document.getElementById('statCerts');

            if (elTotal) elTotal.textContent = stats.total || 0;
            if (elPending) elPending.textContent = stats.pending || 0;
            if (elStaff) elStaff.textContent = '7'; // Mock/Static for now
            if (elCerts) elCerts.textContent = '0'; // Mock/Static for now

            // Fetch and render applications
            const appsRes = await fetch('/api/admin/applications');
            const apps = await appsRes.json();
            
            if (recentTable) renderRecentTable(apps.slice(0, 5));
            if (fullTable) renderFullTable(apps);

            // Re-bind search
            if (appSearch) {
                appSearch.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    const filtered = apps.filter(app => 
                        (app.name_english && app.name_english.toLowerCase().includes(query)) || 
                        (app.registration_no && app.registration_no.toLowerCase().includes(query)) ||
                        (app.contact_no && app.contact_no.toLowerCase().includes(query))
                    );
                    if (fullTable) renderFullTable(filtered);
                });
            }
        } catch (err) {
            console.error('Dashboard Load Error:', err);
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


            // Render Summary with Premium Grid
            let summaryHTML = `
                <div class="summary-block">
                    <h4 class="summary-title">Student Identification</h4>
                    <div class="data-grid-flow">
                        <div class="data-field"><span class="field-label">Full Name</span><span class="field-value">${student.name_english}</span></div>
                        <div class="data-field"><span class="field-label">Native Name</span><span class="field-value">${student.name_tamil}</span></div>
                        <div class="data-field"><span class="field-label">Gender</span><span class="field-value">${student.gender}</span></div>
                        <div class="data-field"><span class="field-label">Date of Birth</span><span class="field-value">${student.dob_day}/${student.dob_month}/${student.dob_year}</span></div>
                        <div class="data-field"><span class="field-label">Aadhaar No</span><span class="field-value">${student.aadhar_no}</span></div>
                        <div class="data-field"><span class="field-label">Blood Group</span><span class="field-value">${student.blood_group}</span></div>
                        <div class="data-field"><span class="field-label">Contact No</span><span class="field-value">${student.contact_no}</span></div>
                        <div class="data-field"><span class="field-label">Email Address</span><span class="field-value">${student.email}</span></div>
                        <div class="data-field" style="grid-column: span 2;"><span class="field-label">Residential Address</span><span class="field-value">${student.address}</span></div>
                    </div>
                </div>
            `;

            parents.forEach(p => {
                summaryHTML += `
                    <div class="summary-block">
                        <h4 class="summary-title">${p.relation.toUpperCase()}'S BACKGROUND</h4>
                        <div class="data-grid-flow">
                            <div class="data-field"><span class="field-label">Full Name</span><span class="field-value">${p.name}</span></div>
                            <div class="data-field"><span class="field-label">Date of Birth</span><span class="field-value">${p.dob}</span></div>
                            <div class="data-field"><span class="field-label">Qualification</span><span class="field-value">${p.qualification || '-'}</span></div>
                            <div class="data-field"><span class="field-label">Occupation</span><span class="field-value">${p.occupation || '-'}</span></div>
                            <div class="data-field"><span class="field-label">Monthly Income</span><span class="field-value">${p.monthly_income || '-'}</span></div>
                            <div class="data-field"><span class="field-label">Aadhaar No</span><span class="field-value">${p.aadhar_no || '-'}</span></div>
                            <div class="data-field" style="grid-column: span 2;"><span class="field-label">Office Details</span><span class="field-value">${p.office_name || '-'}, ${p.office_address || '-'}</span></div>
                        </div>
                    </div>
                `;
            });

            detInfoContent.innerHTML = summaryHTML;

            // Render Documents Registry
            detDocsGrid.innerHTML = '';
            detDocsGrid.className = 'doc-registry-grid';
            documents.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'doc-pill-card';
                card.innerHTML = `
                    <p class="doc-name">${doc.doc_type.replace(/_/g, ' ')}</p>
                    <div class="doc-preview-box">
                        <img src="/${doc.file_path}" onclick="window.open('/${doc.file_path}')" title="Click to Expand">
                    </div>
                    <a href="/${doc.file_path}" download class="btn-download-flat">Download Certificate</a>
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
