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
            tbody.innerHTML = res.data.map(p => `
                <tr>
                    <td>${p.p_no}</td>
                    <td>${p.name}</td>
                    <td>${p.tell}</td>
                    <td>${p.birthDate}</td>
                    <td>${p.placeBirth}</td>
                    <td>${p.add_no}</td>
                    <td>${p.gmail}</td>
                    <td>${p.regdate}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="prepareEdit(${p.p_no})">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <button class="btn btn-sm btn-danger" onclick="deletePeople(${p.p_no})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    });
}
function toggleTable() {
    const container = document.getElementById("table-container");
    
    if (container.style.display === "none") {
        container.style.display = "block"; // Muuji table-ka
        loadPeopleTable(); // Isla markiiba soo rari xogta
    } else {
        container.style.display = "none"; // Qari haddii uu furnaa
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
//     // 1. U dir 'select' iyo ID-ga gaarka ah (num) Procedure-ka
//     fetch('/api/people/execute', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ oper: 'select', num: id })
//     })
//     .then(res => res.json())
//     .then(res => {
//         if (res.success && res.data.length > 0) {
//             const person = res.data[0];

//             setTimeout(() => {
//                 document.getElementById("num").value = person.p_no;
//                 document.getElementById("pname").value = person.name;
//                 document.getElementById("phone").value = person.tell;
//                 document.getElementById("psex").value = person.sex;

//                 if (person.birthDate) {
//                     const bDate = new Date(person.birthDate).toISOString().split('T')[0];
//                     document.getElementById("birDate").value = bDate;
//                 }

//                 document.getElementById("plbirth").value = person.placeBirth;
//                 document.getElementById("addno").value = person.add_no;
//                 document.getElementById("pgmail").value = person.gmail;
//             }, 100);


//             // // 2. Ku shub xogta Form-ka
//             // document.getElementById("num").value = person.p_no; // ID-ga qarsoon
//             // document.getElementById("pname").value = person.name;
//             // document.getElementById("phone").value = person.tell;
//             // document.getElementById("psex").value = person.sex;
            
//             // // Format Date (YYYY-MM-DD) waayo input type="date" ayaa sidaas raba
//             // const bDate = new Date(person.birthDate).toISOString().split('T')[0];
//             // document.getElementById("birDate").value = bDate;
            
//             // document.getElementById("plbirth").value = person.placeBirth;
//             // document.getElementById("addno").value = person.add_no;
//             // document.getElementById("pgmail").value = person.gmail;

//             // // 3. Beddel batoonka si uu u muujiyo "Update" halkii uu ka ahaan lahaa "Keydi"
//             // const saveBtn = document.querySelector("#peopleForm button");
//             // saveBtn.innerHTML = '<i class="fas fa-edit"></i> Beddel Xogta';
//             // saveBtn.className = "btn btn-warning px-5";
//             // saveBtn.onclick = () => savePeople('update'); // Beddel action-ka
            
//             // U kaxay qofka xaga sare ee Form-ka
//             window.scrollTo(0, 0);
//         }
//     })
//     .catch(err => console.error("Error fetching person details:", err));
// }
// function editFromSearch() {
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
function searchAndEdit() {
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
            
            alert("Xogtii waa la helay, hadda waad beddeli kartaa.");
        } else {
            alert("Ma jiro qof leh ID-gaas: " + searchId);
        }
    })
    .catch(err => console.error("Search Error:", err));
}
function resetFormToSave() {
    const form = document.getElementById('peopleForm');
    
    // 1. Sifee form-ka caadiga ah
    form.reset();

    // 2. Tirtir Search-ka (Target-ka saxda ah ee Input-ka sare)
    const searchInput = document.querySelector('input[placeholder="Search ..."]');
    if (searchInput) {
        searchInput.value = ""; 
    }

    // 3. Hubi in ID-ga qarsoon uu noqdo 0
    document.getElementById("num").value = "0";

    // 4. Batoonka 'Update' ku celi 'Save'
    // Waxaan isticmaalaynaa ID-ga batoonka si uu 100% u shaqeeyo
    const saveBtn = document.getElementById("btnSave"); // Hubi in batoonkaaga uu leeyahay id="btnSave"
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        saveBtn.className = "btn btn-primary px-5";
        saveBtn.setAttribute("onclick", "savePeople('insert')"); // Ku celi insert
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
            body: JSON.stringify({ oper: 'delete', num: id })
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                alert(res.message); // Waxay soo muujinaysaa "Deleted successfully"
                loadPeopleTable(); // Isla markiiba Table-ka cusub soo saar
            }
        });
    }
}


