 fetch("/api/session-user")
      .then(res => {
          if(!res.ok) throw "Not Logged In";
          return res.json();
      })
      .then(data => {
          document.getElementById("user").innerText = data.username;
          if(data.userImage) {
              document.getElementById("user-img-top").src = data.userImage ? "/assets/img/" + data.userImage : "/assets/img/default.jpg";
              document.getElementById("user-img-dropdown").src = data.userImage ? "/assets/img/" + data.userImage : "/assets/img/default.jpg";
;
          }
      })
      .catch(() => {
          window.location.href = "/user";
      });
      fetch('/api/sidebar-menu')
    .then(res => res.json())
    .then(menus => {
        // Tani waa line-ka muhiimka ah!
        console.log("Xogta ka timid Database-ka:", menus); 

        const sidebarContainer = document.getElementById("nav-sidebar"); 
        let html = '';

        menus.forEach(menu => {
            html += `
            <li class="nav-item">
                <a data-bs-toggle="collapse" href="#menu-${menu.prid}">
                    <i class="${menu.icon}"></i>
                    <p>${menu.name}</p>
                    <span class="caret"></span>
                </a>
                <div class="collapse" id="menu-${menu.prid}">
                    <ul class="nav nav-collapse">
                        ${menu.submenus.map(sub => `
                            <li>
                                <a href="javascript:void(0)" onclick="navigateTo('${sub.href}')">
                                    <span class="sub-item">${sub.name}</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </li>`;
        });
        sidebarContainer.innerHTML = html;
    });


function togglePeopleTable() {
    const container = document.getElementById("table-container");
    
    if (container.style.display === "none") {
        container.style.display = "block"; // Muuji table-ka
        loadPeopleTable(); // Isla markiiba soo rari xogta
        // btn.innerHTML = `<i class="fas fa-eye-slash"></i> Hide Data`;
        // btn.className = "btn btn-warning btn-sm";
    } else {
        container.style.display = "none"; // Qari haddii uu furnaa
        // btn.innerHTML = `<i class="fas fa-eye"></i> Show Data`;
        // btn.className = "btn btn-info btn-sm";
    }
}
    function navigateTo(url) {
    const mainContent = document.getElementById("dynamic-content");
    
    // 1. Muuji Spinner-ka (Loading)
    mainContent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 300px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4 class="ms-3">Loading...</h4>
        </div>`;

    // 2. Ka soo qaad HTML-ka server-ka
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Server-ku ma helin faylka: " + url);
            return res.text();
        })
        .then(html => {
            // 3. Marka xogtu timaado, ka saar spinner-ka oo ku rid HTML-ka
            mainContent.innerHTML = html;
            if (url.includes('people')) {
                setTimeout(() => {
                    fillAddressCombo();
                    loadPeopleTable()
                }, 150); // 150ms ayaa ku filan inuu element-ku soo baxo
            }
        })
        .catch(err => {
            mainContent.innerHTML = `
                <div class="alert alert-danger mt-4">
                    <i class="fas fa-exclamation-triangle"></i> Cilad: ${err.message}
                </div>`;
        });
}

function fillAddressCombo() {
    const addressSelect = document.getElementById("addno");
    
    // Hubi haddii element-ka la helay
    if (!addressSelect) {
        console.warn("Element-ka 'addno' wali lama helin...");
        return; 
    }

    fetch('/api/get-addresses')
        .then(res => res.json())
        .then(data => {
            addressSelect.innerHTML = '<option value="">-- Dooro Address --</option>';
            data.forEach(addr => {
                let option = document.createElement("option");
                option.value = addr.add_no;
                option.text = addr.full_address;
                addressSelect.appendChild(option);
            });
        })
        .catch(err => console.error("Error fillAddressCombo:", err));
}
function loadPeopleTable() {
    const tbody = document.getElementById("people-table-body");
    
    fetch('/api/people/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oper: 'select', num: 0 }) 
    })
    .then(res => res.json())
    .then(res => {
        if (res.success && res.data) {
            tbody.innerHTML = res.data.map(p => {
                // Formatting Date
                const bDate = p.birthDate ? new Date(p.birthDate).toLocaleDateString() : '';
                const rDate = p.regdate ? new Date(p.regdate).toLocaleDateString() : '';
                
                return `
                <tr style="font-size: 13px;">
                    <td>${p.p_no}</td>
                    <td>${p.name}</td>
                    <td>${p.tell}</td>
                    <td>${bDate}</td> 
                    <td>${p.placeBirth}</td> 
                    <td>${p.address_name}</td> 
                    <td>${p.gmail}</td>
                    <td>${rDate}</td> 
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deletePeople(${p.p_no})">
                            <i class="fa fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }
    })
    .catch(err => console.error("Error loading people:", err));
}

//     const id = document.getElementById("searchId").value;
//     console.log("ID =", id);


//     if (!id) {
//         alert("Fadlan geli ID");
//         return;
//     }

//     prepareEdit(id); // function-kii hore
// }
// function editFromSearch() {
//     const input = [...document.querySelectorAll("#searchId")]
//                     .find(el => el.offsetParent !== null);

//     const id = input ? input.value : "";

//     console.log("ID =", id);

//     if (!id) {
//         alert("Fadlan geli ID");
//         return;
//     }

//     prepareEdit(id);
// }
// document.getElementById("searchBtn").addEventListener("click", editFromSearch);
function searchAndEdit(id) {
    // 1. Qabo ID-ga uu qofku ku qoray Search-ka sare
    const searchId = document.querySelector('input[placeholder="Search ..."]').value;

    if (!searchId) {
        alert("Fadlan qor ID-ga aad rabto inaad raadiso!");
        return;
    }

    // 2. Wac Procedure-ka adigoo isticmaalaya oper='select' iyo num=ID
    fetch('/api/people/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oper: 'select', num: searchId })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success && res.data.length > 0) {
            const person = res.data[0];

            // 3. Ku shub xogta Form-ka
            document.getElementById("num").value = person.p_no; // ID-ga qarsoon
            document.getElementById("pname").value = person.name;
            document.getElementById("phone").value = person.tell;
            document.getElementById("psex").value = person.sex;
            document.getElementById("plbirth").value = person.placeBirth;
            document.getElementById("addno").value = person.add_no; // Dropdown-ka
            document.getElementById("pgmail").value = person.gmail;

            // 4. Sax Date-ka (YYYY-MM-DD)
            if (person.birthDate) {
                const date = new Date(person.birthDate);
                document.getElementById("birDate").value = date.toISOString().split('T')[0];
            }

            // 5. Beddel batoonka 'Save' si uu u noqdo 'Update'
            const saveBtn = document.querySelector(".btn-primary"); // Batoonka Save
            saveBtn.innerHTML = '<i class="fas fa-edit"></i> Update Changes';
            saveBtn.setAttribute("onclick", "savePeople('update')"); // Beddel logic-ga
            
            // alert("Xogtii waa la helay, hadda waad beddeli kartaa.");
        } else {
            alert("Ma jiro qof leh ID-gaas: " + searchId);
        }
    })
    .catch(err => console.error("Search Error:", err));
}
function resetFormToSave() {
    // 1. Sifee form-ka
    document.getElementById('peopleForm').reset();
    document.getElementById("num").value = "0";

    // 2. Soo qabo batoonka adigoo isticmaalaya ID-ga rasmiga ah
    const btn = document.getElementById("btnSave");
    
    if (btn) {
        btn.innerHTML = '<i class="fas fa-save"></i> Save'; // Qoraalka beddel
        btn.className = "btn btn-primary px-4"; // Midabka Buluugga ku soo celi
        btn.setAttribute("onclick", "savePeople('insert')"); // Shaqada ku soo celi Insert
    }
}
function savePeople(operation) {
    const form = document.getElementById('peopleForm');
    
    // Validation
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    const formData = {
        pname: document.getElementById("pname").value,
        phone: document.getElementById("phone").value,
        psex: document.getElementById("psex").value,
        birDate: document.getElementById("birDate").value,
        plbirth: document.getElementById("plbirth").value,
        addno: document.getElementById("addno").value,
        pgmail: document.getElementById("pgmail").value,
        rgdate: new Date().toISOString().split('T')[0],
        oper: operation, // 'insert'
        num: document.getElementById("num").value
    };

    fetch('/api/people/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())

    .then(res => {
    if (res.success) {
        const msg = res.message;

        if (msg.includes('successfully')) {
            alert( msg);

                form.reset();

            loadPeopleTable()
            form.classList.remove('was-validated');

        } else if (msg.includes('exists')) {
            alert("Feejignaan: " + msg);
        } else {
            alert(msg);
        }
    }
})

    .catch(err => console.error("Error:", err));
}
function deletePeople(id) {
    if (confirm("Ma hubtaa inaad tirtirto qofkan?")) {
        fetch('/api/people/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oper: 'delete', num: id }) //
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                alert(res.message); // Wuxuu soo celinayaa fariintii Procedure-ka (e.g. "Deleted successfully")
                loadPeopleTable(); // Cusboonaysii table-ka
            }
        })
        .catch(err => console.error("Error delete:", err));
    }
}
function showForm() {
    const formContainer = document.getElementById("registration-form-container");
    
    // Haddii uu qarsoonaa, soo bandhig
    if (formContainer.style.display === "none") {
        formContainer.style.display = "block";
        
        // Sidoo kale, waad sifeyn kartaa form-ka si uu diyaar u noqdo
        resetFormToSave(); 
    } else {
        // Haddii aad rabto inaad dib u qariso marka mar kale la riixo
        formContainer.style.display = "none";
    }
}
let currentTable = ""; // Table-ka hadda la furay
// 1. Qeex xogta table- walba (Schemas)
const tableSchemas = {
    'jobs': ['title', 'salary'],
    'staff_type': ['tyname'],
    'degree': ['degname', 'description'],
    'country': ['contName', 'stateName', 'city'],
    'status': ['stname'],
    'specilization': ['spname', 'description'],
    'accounts':['acc_name','institution','balance'],
    'salary_charge':['stf_no','amount','sal_date','description'],
    'salary_payment':['sal_ch_no','amount','sal_date','acc_no']
};

// 2. Function-ka furaya Modal-ka
function openUniversalModal(tableName, idName) {
    const container = document.getElementById("dynamicInputs");
    container.innerHTML = ""; 

    // 1. Hubi haddii schema-ga table-kan uu jiro
    const fields = tableSchemas[tableName];
    
    if (!fields) {
        console.error(`Cillad: Table-ka '${tableName}' kuma jiro tableSchemas!`);
        alert(`Cillad farsamo: Schema-ga '${tableName}' lama helin.`);
        return; // Ha furin modal-ka haddii xogta la waayo
    }

    // 2. Ku shub xogta hidden inputs-ka
    document.getElementById("hiddenTableName").value = tableName; 
    document.getElementById("hiddenIdName").value = idName;
    document.getElementById("hiddenIdVal").value = "0"; 
    
    document.getElementById("modalTitle").innerText = `Maamulka ${tableName}`;
    
    // 3. Dhis inputs-ka
    fields.forEach(field => {
        container.innerHTML += `
            <div class="col-md-12 mb-3">
                <label class="form-label">${field}</label>
                <input type="text" class="form-control dynamic-input" id="inp_${field}" placeholder="Gali ${field}">
            </div>`;
    });

    // 4. Hadda fur modal-ka maadaama xogtu diyaar tahay
    const modalElement = document.getElementById('universalModal');
    const myModal = new bootstrap.Modal(modalElement);
    myModal.show();
}
async function loadDynamicTable(tableName, idName, containerId) {
    const response = await fetch('/api/universal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableName, oper: 'select', idName: idName, idVal: 0, data: {} })
    });

    const res = await response.json();
    console.log("Xogta ka timid Server-ka:", res); // Tan fiiri F12 (Console)

    if (res.success && res.data && res.data.length > 0) {
        const columns = Object.keys(res.data[0]);
        // ... dhis table-ka
            let html = `
            <table class="table table-hover table-bordered shadow-sm">
                <thead class="bg-dark text-white">
                    <tr>
                        ${columns.map(col => `<th>${col.toUpperCase()}</th>`).join('')}
                        <th class="text-center">ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.data.map(row => `
                    <tr>
                        ${columns.map(col => `<td>${row[col]}</td>`).join('')}
                        <td class="text-center">
                            <button class="btn btn-sm btn-info me-1" onclick="editRow('${tableName}', '${idName}', ${row[idName]})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteGeneric('${tableName}', '${idName}', ${row[idName]})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
            document.getElementById(containerId).innerHTML = html;
    } else {
        document.getElementById(containerId).innerHTML = `
            <div class="alert alert-info">Ma jirto xog hadda laga helay table-ka ${tableName}.</div>`;
    }
}
function getFieldsForTable(tableName) {
    const tableStructure = {
        'jobs': ['title', 'salary'], // Sida sawirkaaga ka muuqata
        'staff_type': ['st_name'],
        'specialization': ['s_name'],
        'degree': ['d_name']
        // Halkan ku dar 17-kaaga table mid kasta iyo columns-kiisa
    };
    return tableStructure[tableName] || [];
}
function openModal(tableName, idName, data = null) {
    currentTable = tableName;
    document.getElementById("modalTitle").innerText = `Maamulka ${tableName}`;
    
    // 1. SAXID: Ku shub magaca table-ka hidden input-ka
    document.getElementById("hiddenTableName").value = tableName; 
    document.getElementById("hiddenIdName").value = idName;
    document.getElementById("hiddenIdVal").value = data ? data[idName] : "0";
    
    const inputContainer = document.getElementById("dynamicInputs");
    inputContainer.innerHTML = ""; // Nadiifi wixii hore

    // 2. SAXID: Haddii xog (data) la waayo, u yeer getFieldsForTable si modal-ku u dhismo
    const fields = data ? Object.keys(data) : getFieldsForTable(tableName);

    fields.forEach(field => {
        // PK-ga ha u samayn input muuqda
        if (field !== idName) {
            inputContainer.innerHTML += `
                <div class="mb-3">
                    <label class="form-label">${field}</label>
                    <input type="text" class="form-control dynamic-input" id="${field}" 
                           placeholder="Gali ${field}" 
                           value="${data ? data[field] : ''}">
                </div>`;
        }
    });

    const myModal = new bootstrap.Modal(document.getElementById('universalModal'));
    myModal.show();
}
async function saveData() {
    try {
        // 1. Soo qaado xogta muhiimka ah ee ku dhex qarson Modal-ka
        const tableName = document.getElementById("hiddenTableName").value;
        const idName = document.getElementById("hiddenIdName").value;
        const idVal = document.getElementById("hiddenIdVal").value;

        // Hubi in tableName uu jiro si aanu 500 Error ugu dhicin Server-ka
        if (!tableName) {
            alert("Cillad: Magaca table-ka lama helin!");
            return;
        }

        const oper = (idVal == "0") ? "insert" : "update";
        const data = {};
        
        // 2. Ururi xogta dhammaan inputs-ka leh class-ka 'dynamic-input'
        const inputs = document.querySelectorAll(".dynamic-input");
        inputs.forEach(input => {
            const fieldName = input.id.replace("inp_", "");
            data[fieldName] = input.value;
        });

        // 3. SAXID: Halkan ayaan ku qeexnay 'body' si looga fogaado ReferenceError
        const body = {
            table: tableName,
            oper: oper,
            idName: idName,
            idVal: idVal,
            data: data
        };

        // 4. U dir xogta API-ga
        const response = await fetch('/api/universal/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const res = await response.json();

        // 5. Maaree Jawaabta (Success ama Failure)
        if (res.success) {
            // Soo bandhig fariinta dhabta ah (Success ama Already Exists)
            alert(res.message); 

            // Modal-ka xir kaliya haddii fariintu ay ku jirto ereyga 'success'
            if (res.message.toLowerCase().includes("success")) {
                const modalElement = document.getElementById('universalModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                
                if (modalInstance) {
                    modalInstance.hide();
                }

                // Dib u load-garee xogta table-ka si aad u aragto isbeddelka
                loadDynamicTable(tableName, idName, 'tableContainer');
            } else {
                console.log("Xogta lama kaydin: ", res.message);
            }
        } else {
            // Haddii uu jiro SQL Error (Tani waxay badalaysaa 500 Error-ka aamusnaanta ah)
            alert("Bug ka yimid Database-ka: " + res.error);
            console.error("Debug Info:", res);
        }

    } catch (err) {
        console.error("Save Error:", err);
        // alert("Xiriirka Server-ka waa go'an yahay ama code-ka ayaa qalad leh.");
    }
}
async function deleteGeneric(tableName, idName, idValue) {
    // 1. Weydiiso qofka xaqiijin (Confirmation)
    if (!confirm(`Ma hubtaa inaad tirtirto xogtan ku jirta table-ka ${tableName}?`)) return;

    const response = await fetch('/api/universal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: tableName,
            oper: 'delete', // Procedure-ka wuxuu isticmaali doonaa qaybta Delete
            idName: idName,
            idVal: idValue,
            data: {}
        })
    });

    const res = await response.json();
    if (res.success) {
        alert(res.message);
        // 2. Dib u rari table-ka si xariiqii tirtirmay u baxo
        loadDynamicTable(tableName, idName, 'tableContainer');
    } else {
        alert("Error: " + res.error);
    }
}
function toggleTable(tableName, idName) {
    const container = document.getElementById('tableContainer');
    const btn = document.getElementById('btnToggleTable');

    if (container.style.display === "none") {
        // 1. Soo rari xogta haddii uu table-ku xirnaa
        loadDynamicTable(tableName, idName, 'tableContainer');
        
        // 2. Muuji container-ka oo beddel batoonka
        container.style.display = "block";
        btn.innerHTML = `<i class="fas fa-eye-slash"></i> Hide Data`;
        btn.className = "btn btn-warning btn-sm"; // Beddel midabka si loo dareemo
    } else {
        // 3. Qari container-ka haddii uu furnaa
        container.style.display = "none";
        btn.innerHTML = `<i class="fas fa-eye"></i> Show Data`;
        btn.className = "btn btn-info btn-sm";
    }
}
function editRow(tableName, idName, idVal) {
    // 1. Raadi dhammaan xogta table-ka ee hadda ku dhex jirta 'tableContainer'
    // Waxaan u isticmaalaynaa xogta hadda muuqata si aanan Server-ka mar kale u wicin (Fast Edit)
    const table = document.querySelector("#tableContainer table");
    const rows = Array.from(table.querySelectorAll("tbody tr"));

    // 2. Soo saar xogta xariiqda (row) saxda ah adoo eegaya ID-ga
    const rowToEdit = rows.find(row => {
        // Waxaan u qaadanaynaa in ID-gu yahay tiirka (column) u horreeya
        return row.cells[0].innerText == idVal; 
    });

    if (rowToEdit) {
        const data = {};
        const headers = Array.from(table.querySelectorAll("thead th"));

        // 3. Khariiddee (Map) xogta tiirarka iyo qiyamkooda
        headers.forEach((header, index) => {
            const columnName = header.innerText.toLowerCase();
            if (columnName !== 'action') {
                data[columnName] = rowToEdit.cells[index].innerText;
            }
        });

        console.log("Xogta la rabo in la edit-gareeyo:", data);

        // 4. Fur Modal-ka adoo u diraya xogta (data) si uu u buuxiyo inputs-ka
        openModal(tableName, idName, data);
    } else {
        alert("Waan ka xunnahay, xogta xariiqdaas lama helin!");
    }
}