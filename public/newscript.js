/**
 * MYSCRIPT.JS - STAFF MANAGEMENT SYSTEM
 * Xallinta: Undefined Tabs & Procedure Parameter Mismatch
 */

let allMenus = []; 

// 1. SESSION & USER INFO
fetch("/api/session-user")
    .then(res => {
        if(!res.ok) throw "Not Logged In";
        return res.json();
    })
    .then(data => {
        document.getElementById("user").innerText = data.username;
        const userImg = data.userImage ? "/assets/img/" + data.userImage : "/assets/img/default.jpg";
        if(document.getElementById("user-img-top")) document.getElementById("user-img-top").src = userImg;
        if(document.getElementById("user-img-dropdown")) document.getElementById("user-img-dropdown").src = userImg;
    })
    .catch(() => { window.location.href = "/user"; });

// 2. SIDEBAR MENU FETCH
// Waxaan isticmaalnay sub.subname si looga fogaado undefined
fetch('/api/sidebar-menu')
    .then(res => res.json())
    .then(menus => {
        allMenus = menus; 
        const sidebarContainer = document.getElementById("nav-sidebar"); 
        let html = '';

        menus.forEach(menu => {
            html += `
            <li class="nav-item">
                <a data-bs-toggle="collapse" href="#menu-${menu.prid}" onclick="openModuleTabs(${menu.prid})">
                    <i class="${menu.icon}"></i>
                    <p>${menu.name}</p>
                    <span class="caret"></span>
                </a>
                <div class="collapse" id="menu-${menu.prid}">
                    <ul class="nav nav-collapse">
                        ${menu.submenus.map(sub => `
                            <li>
                                <a href="javascript:void(0)" onclick="switchActiveTab('${sub.subname}', '${sub.proc_name}', '${sub.subname}', this)">
                                    <span class="sub-item">${sub.subname}</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </li>`;
        });
        sidebarContainer.innerHTML = html;
    });

// 3. TABLE SCHEMAS (Ku dar dhammaan table-ladaada halkan)
const tableSchemas = {
    'job': ['title', 'salary'], // Sida sawirkaaga procedure-ka
    'staff_type': ['tyname'],
    'degree': ['degname', 'description'],
    'country': ['contName', 'stateName', 'city'],
    'status': ['stname'],
    'specilization': ['spname', 'description'],
    'accounts': ['acc_name', 'institution', 'balance']
};

// 4. DYNAMIC TABS & CONTENT
function openModuleTabs(prid) {
    const selectedModule = allMenus.find(m => m.prid == prid);
    if (selectedModule && selectedModule.submenus) {
        document.getElementById("dashboardHome").style.display = "none";
        document.getElementById("dynamicTabArea").style.display = "block";

        const tabsList = document.getElementById("dynamicTabsList");
        tabsList.innerHTML = "";

        selectedModule.submenus.forEach((sub, index) => {
            const isActive = index === 0 ? 'active' : '';
            tabsList.innerHTML += `
                <li class="nav-item">
                    <button class="nav-link ${isActive}" 
                        onclick="switchActiveTab('${sub.subname}', '${sub.proc_name}', '${sub.subname}', this)">
                        ${sub.subname}
                    </button>
                </li>`;
        });

        const first = selectedModule.submenus[0];
        if (first) switchActiveTab(first.subname, first.proc_name, first.subname);
    }
}

async function switchActiveTab(subname, proc_name, label, btnElement = null) {
    if (!subname || !proc_name) return;

    // UI Update
    document.querySelectorAll('#dynamicTabsList .nav-link').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    // Soo hel Primary Key-ga saxda ah
    const response = await fetch(`/api/get-table-id/${subname}`);
    const idData = await response.json();
    const idName = idData.success ? idData.idName : 'id'; 

    document.getElementById("activeTabTitle").innerText = `Maamulka ${label}`;
    const btnArea = document.getElementById("tabButtons");
    btnArea.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="openUniversalModal('${proc_name}', '${idName}')">
            <i class="fas fa-plus"></i> Add ${label}
        </button>
        <button class="btn btn-info btn-sm text-white ms-1" onclick="loadDynamicTable('${proc_name}', '${idName}', 'universalTableContainer')">
            <i class="fas fa-sync"></i> Refresh
        </button>`;

    loadDynamicTable(proc_name, idName, 'universalTableContainer');
}

// 5. LOAD TABLE (Fixed: 4 Parameters Only)
async function loadDynamicTable(procName, idName, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetch('/api/execute-proc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                procedureName: procName,
                operation: 'select',
                idValue: 0
                // Halkan kuma lihin 6 parameters si looga fogaado error-ka
            })
        });

        const result = await response.json();
        if (result.success && result.data.length > 0) {
            buildDynamicTable(result.data, idName, containerId, procName);
        } else {
            container.innerHTML = `<div class="alert alert-info">Ma jirto xog laga helay table-ka ${procName}.</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div class="alert alert-danger">Cilad: ${err.message}</div>`;
    }
}

// 6. MODAL & SAVE (Universal CRUD)
function openUniversalModal(tableName, idName) {
    const container = document.getElementById("dynamicInputs");
    container.innerHTML = ""; 
    const fields = tableSchemas[tableName] || [];

    document.getElementById("hiddenTableName").value = tableName; 
    document.getElementById("hiddenIdName").value = idName;
    document.getElementById("hiddenIdVal").value = "0"; 
    document.getElementById("modalTitle").innerText = `Kudar ${tableName}`;
    
    fields.forEach(field => {
        container.innerHTML += `
            <div class="col-md-12 mb-3">
                <label class="form-label">${field.toUpperCase()}</label>
                <input type="text" class="form-control dynamic-input" id="inp_${field}" placeholder="Gali ${field}">
            </div>`;
    });

    new bootstrap.Modal(document.getElementById('universalModal')).show();
}

async function saveData() {
    const tableName = document.getElementById("hiddenTableName").value;
    const idName = document.getElementById("hiddenIdName").value;
    const idVal = document.getElementById("hiddenIdVal").value;
    
    const data = {};
    document.querySelectorAll(".dynamic-input").forEach(input => {
        const fieldName = input.id.replace("inp_", "");
        data[fieldName] = input.value;
    });

    const response = await fetch('/api/universal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: tableName,
            oper: (idVal == "0") ? "insert" : "update",
            idName: idName,
            idVal: idVal,
            data: data
        })
    });

    const res = await response.json();
    alert(res.message);
    if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('universalModal')).hide();
        loadDynamicTable(tableName, idName, 'universalTableContainer');
    }
}

// 7. BUILD TABLE HELPER
function buildDynamicTable(data, idName, containerId, procName) {
    const container = document.getElementById(containerId);
    const headers = Object.keys(data[0]);

    let tableHtml = `
    <div class="table-responsive">
        <table class="table table-head-bg-primary mt-4">
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}
                    <th>ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        ${headers.map(h => `<td>${row[h]}</td>`).join('')}
                        <td>
                            <button class="btn btn-link btn-danger" onclick="deleteGeneric('${procName}', '${idName}', '${row[idName]}')">
                                <i class="fa fa-times"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;
    container.innerHTML = tableHtml;
}

async function deleteGeneric(tableName, idName, idValue) {
    if (!confirm(`Ma hubtaa inaad tirtirto?`)) return;
    const response = await fetch('/api/universal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableName, oper: 'delete', idName: idName, idVal: idValue, data: {} })
    });
    const res = await response.json();
    if (res.success) {
        alert(res.message);
        loadDynamicTable(tableName, idName, 'universalTableContainer');
    }
}