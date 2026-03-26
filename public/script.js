
document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    const totalSteps = 4;
    const form = document.getElementById('admissionForm');
    const continueBtn = document.getElementById('continueBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const stepItems = document.querySelectorAll('.step-item');
    const formSteps = document.querySelectorAll('.form-step');
    const progressBar = document.getElementById('progressBar');
    const currentStepText = document.getElementById('currentStepText');

    // 1. Initial Load from LocalStorage
    loadFromStorage();

    // Navigation logic
    continueBtn.addEventListener('click', async () => {
        if (validateAndScroll(currentStep)) {
            showLoading(continueBtn, true);
            await new Promise(r => setTimeout(r, 400));
            
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
                saveState(); // Save step change
                if (currentStep === totalSteps) {
                    generateSummary();
                }
            }
            showLoading(continueBtn, false);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
            saveState();
        }
    });

    function showLoading(btn, isLoading) {
        const span = btn.querySelector('span');
        const spinner = btn.querySelector('.spinner');
        if (isLoading) {
            btn.disabled = true;
            if (span) span.style.opacity = '0';
            if (spinner) spinner.style.display = 'block';
        } else {
            btn.disabled = false;
            if (span) span.style.opacity = '1';
            if (spinner) spinner.style.display = 'none';
        }
    }

    function updateUI() {
        formSteps.forEach(step => step.classList.remove('active'));
        const activeStepPanel = document.getElementById(`step${currentStep}`);
        activeStepPanel.classList.add('active');

        stepItems.forEach(item => {
            const stepNum = parseInt(item.dataset.step);
            item.classList.remove('active', 'completed');
            const icon = item.querySelector('.step-icon');
            
            if (stepNum === currentStep) {
                item.classList.add('active');
                icon.innerHTML = stepNum.toString().padStart(2, '0');
            } else if (stepNum < currentStep) {
                item.classList.add('completed');
                icon.innerHTML = '✓';
            } else {
                icon.innerHTML = stepNum.toString().padStart(2, '0');
            }
        });

        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
        currentStepText.textContent = currentStep;

        prevBtn.style.display = currentStep === 1 ? 'none' : 'flex';
        if (currentStep === totalSteps) {
            continueBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            continueBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. Advanced Validation with Auto-Scroll
    function validateAndScroll(step) {
        const currentPanel = document.getElementById(`step${step}`);
        const requiredInputs = currentPanel.querySelectorAll('[required]');
        let firstInvalidField = null;
        let isValid = true;
        
        requiredInputs.forEach(input => {
            const isFieldValid = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
            
            if (!isFieldValid) {
                isValid = false;
                applyValidationStyle(input, false);
                if (!firstInvalidField) firstInvalidField = input;
            } else {
                applyValidationStyle(input, true);
            }
        });

        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => firstInvalidField.focus(), 500);
        }
        
        return isValid;
    }

    function applyValidationStyle(input, isValid) {
        if (!isValid) {
            input.style.borderColor = 'var(--error)';
            input.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
        } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

    // 3. Smart Input Behaviors
    form.addEventListener('input', (e) => {
        const target = e.target;
        saveState();

        const nameFields = ['name_english', 'father_name', 'mother_name'];
        if (nameFields.includes(target.name)) {
            target.value = target.value.replace(/\b\w/g, char => char.toUpperCase());
        }

        const phoneFields = ['contact_no', 'father_phone', 'mother_phone'];
        if (phoneFields.includes(target.name)) {
            let val = target.value.replace(/\D/g, '');
            if (val.startsWith('91') && val.length > 2) val = val.substring(2);
            if (val.length > 10) val = val.substring(0, 10);
            let formatted = '+91 ';
            if (val.length > 0) formatted += val.substring(0, 5);
            if (val.length > 5) formatted += ' ' + val.substring(5, 10);
            target.value = val ? formatted : '';
        }

        const dobOrder = ['dob_day', 'dob_month', 'dob_year'];
        if (dobOrder.includes(target.name)) {
            const max = target.getAttribute('maxlength') || (target.name === 'dob_year' ? 4 : 2);
            if (target.value.length >= max) {
                const nextIdx = dobOrder.indexOf(target.name) + 1;
                if (nextIdx < dobOrder.length) {
                    const nextField = document.getElementsByName(dobOrder[nextIdx])[0];
                    if (nextField) nextField.focus();
                }
            }
        }
    });

    // 4. Persistence (LocalStorage) Logic
    function saveState() {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (!(value instanceof File)) data[key] = value;
        });
        localStorage.setItem('mcc_form_data', JSON.stringify({
            step: currentStep,
            fields: data
        }));
    }

    function loadFromStorage() {
        const saved = localStorage.getItem('mcc_form_data');
        if (saved) {
            const { step, fields } = JSON.parse(saved);
            for (const [name, value] of Object.entries(fields)) {
                const input = document.getElementsByName(name)[0];
                if (input) {
                    if (input.type === 'radio') {
                        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
                        if (radio) radio.checked = true;
                    } else if (input.type === 'checkbox') {
                        input.checked = value === 'on';
                    } else {
                        input.value = value;
                    }
                }
            }
            currentStep = step;
            updateUI();
        }
    }

    function clearStorage() {
        localStorage.removeItem('mcc_form_data');
    }

    // Continuous Review Summary (Refined for Details View)
    function generateSummary() {
        const container = document.getElementById('finalReviewContainer');
        const formData = new FormData(form);
        
        const getVal = (name) => formData.get(name) || '-';

        const renderEntry = (label, val) => `
            <div class="review-entry">
                <div class="review-label-fixed">${label}</div>
                <div class="review-value-fluid">${val}</div>
            </div>`;

        let html = `
            <div class="review-continuous-container">
                <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); margin-bottom:15px; border-bottom:1px solid var(--border-color); padding-bottom:5px;">PERSONAL INFORMATION</div>
                ${renderEntry('Class Registered', getVal('class_registered'))}
                ${renderEntry('Full Name (English)', getVal('name_english'))}
                ${renderEntry('Full Name (Tamil)', getVal('name_tamil'))}
                ${renderEntry('Date of Birth', `${getVal('dob_day')}/${getVal('dob_month')}/${getVal('dob_year')}`)}
                ${renderEntry('Gender', getVal('gender'))}
                ${renderEntry('Aadhaar Number', getVal('aadhar_no'))}

                <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); margin:25px 0 15px 0; border-bottom:1px solid var(--border-color); padding-bottom:5px;">CONTACT & COMMUNITY</div>
                ${renderEntry('Religion', getVal('religion'))}
                ${renderEntry('Community / Caste', `${getVal('community')} / ${getVal('caste')}`)}
                ${renderEntry('Phone Number', getVal('contact_no'))}
                ${renderEntry('Email Address', getVal('email'))}
                ${renderEntry('Address', getVal('address'))}

                <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); margin:25px 0 15px 0; border-bottom:1px solid var(--border-color); padding-bottom:5px;">FAMILY DETAILS</div>
                <div class="review-cols">
                    <div class="review-col-half">
                        <div style="font-size:0.7rem; font-weight:800; color:var(--maroon); margin-bottom:10px;">FATHER</div>
                        ${renderEntry('Name', getVal('father_name'))}
                        ${renderEntry('Occupation', getVal('father_occupation'))}
                        ${renderEntry('Income', getVal('father_income'))}
                    </div>
                    <div class="review-col-divider"></div>
                    <div class="review-col-half">
                        <div style="font-size:0.7rem; font-weight:800; color:var(--maroon); margin-bottom:10px;">MOTHER</div>
                        ${renderEntry('Name', getVal('mother_name'))}
                        ${renderEntry('Occupation', getVal('mother_occupation'))}
                        ${renderEntry('Income', getVal('mother_income'))}
                    </div>
                </div>

                <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); margin:25px 0 15px 0; border-bottom:1px solid var(--border-color); padding-bottom:5px;">ACADEMIC & PREVIOUS SCHOOL</div>
                ${renderEntry('Prev. School', getVal('previous_school_name'))}
                ${renderEntry('Sibling Info', `${getVal('sibling_name')} (Std: ${getVal('sibling_std')})`)}
                ${renderEntry('Medical Notes', getVal('medical_history'))}
            </div>
        `;
        container.innerHTML = html;
    }

    function cleanPhone(val) {
        return val.replace(/\+91 /g, '').replace(/ /g, '');
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!document.getElementById('declareCheck').checked) {
            alert('Please confirm the details to proceed.');
            return;
        }

        const apiData = new FormData();
        const mainFormData = new FormData(form);

        const student = {
            academic_year: "2026 - 2027",
            class_registered: mainFormData.get('class_registered'),
            name_english: mainFormData.get('name_english'),
            name_tamil: mainFormData.get('name_tamil'),
            dob_day: mainFormData.get('dob_day'),
            dob_month: mainFormData.get('dob_month'),
            dob_year: mainFormData.get('dob_year'),
            gender: mainFormData.get('gender'),
            blood_group: mainFormData.get('blood_group'),
            nationality: mainFormData.get('nationality'),
            religion: mainFormData.get('religion'),
            caste: mainFormData.get('caste'),
            community: mainFormData.get('community'),
            aadhar_no: mainFormData.get('aadhar_no'),
            address: mainFormData.get('address'),
            contact_no: cleanPhone(mainFormData.get('contact_no') || ''),
            email: mainFormData.get('email'),
            mother_tongue: mainFormData.get('mother_tongue'),
            other_languages: mainFormData.get('other_languages'),
            school_earlier_name: mainFormData.get('previous_school_name'),
            school_earlier_class: mainFormData.get('previous_school_class'),
            school_earlier_year: mainFormData.get('previous_school_year'),
            emis_no: mainFormData.get('emis_no'),
            id_mark_1: mainFormData.get('id_mark_1'),
            id_mark_2: mainFormData.get('id_mark_2'),
            medical_history: mainFormData.get('medical_history')
        };

        const parents = [
            {
                relation: 'Father',
                name: mainFormData.get('father_name'),
                dob: mainFormData.get('father_dob'),
                qualification: mainFormData.get('father_qualification'),
                occupation: mainFormData.get('father_occupation'),
                office_name: mainFormData.get('father_office'),
                office_address: mainFormData.get('father_office_address'),
                mobile_landline: cleanPhone(mainFormData.get('father_phone') || ''),
                monthly_income: mainFormData.get('father_income'),
                aadhar_no: mainFormData.get('father_aadhar')
            },
            {
                relation: 'Mother',
                name: mainFormData.get('mother_name'),
                dob: mainFormData.get('mother_dob'),
                qualification: mainFormData.get('mother_qualification'),
                occupation: mainFormData.get('mother_occupation'),
                office_name: mainFormData.get('mother_office'),
                office_address: mainFormData.get('mother_office_address'),
                mobile_landline: cleanPhone(mainFormData.get('mother_phone') || ''),
                monthly_income: mainFormData.get('mother_income'),
                aadhar_no: mainFormData.get('mother_aadhar')
            }
        ];

        const associations = [
            { type: 'Staff', name: '', year_or_std: '', dept_unit_school: mainFormData.get('staff_details') },
            { type: 'Alumni', name: mainFormData.get('alumni_name'), year_or_std: mainFormData.get('alumni_year'), dept_unit_school: '' },
            { type: 'Sibling', name: mainFormData.get('sibling_name'), year_or_std: mainFormData.get('sibling_std'), dept_unit_school: '' }
        ];

        apiData.append('student', JSON.stringify(student));
        apiData.append('parents', JSON.stringify(parents));
        apiData.append('associations', JSON.stringify(associations));

        const fileFields = ['photo', 'aadhar_copy', 'birth_cert', 'community_cert', 'transfer_cert'];
        fileFields.forEach(key => {
            const input = document.getElementsByName(key)[0];
            if (input && input.files[0]) apiData.append(key, input.files[0]);
        });

        showLoading(submitBtn, true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: apiData
            });

            const result = await response.json();
            if (result.success) {
                clearStorage();
                document.querySelector('.app-container').style.opacity = '0';
                setTimeout(() => {
                    document.querySelector('.app-container').style.display = 'none';
                    document.getElementById('successModal').style.display = 'flex';
                }, 300);
            } else {
                alert('Submission error: ' + result.message);
            }
        } catch (err) {
            console.error(err);
            alert('A network error occurred.');
        } finally {
            showLoading(submitBtn, false);
        }
    });
});

function closeModal() {
    window.location.reload();
}
