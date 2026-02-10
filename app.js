
let express=require("express");
let path=require("path");

let my=require("mysql2");
let session=require("express-session");
let app=express();
// Ku dar kuwan app.js xaga sare
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// app.use(express.urlencoded({extended:false}));
let conn=my.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"staff_system"
}).promise();

app.use(session({
    secret:"exm7",
    resave:false,
    saveUninitialized:false,
    cookie:{secure:false,httpOnly:true}
}));

app.get("/user",(req,res)=>{
    res.sendFile(path.join(__dirname, "login.html"));
})

app.get("/home",(req,res)=>{
    if(!req.session.user){
        return res.redirect("/user")
    }
    res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.post("/log", async (req, res) => {
    let user = req.body.txt1;
    let pass = req.body.txt2;

    try {
        let sql = "SELECT * FROM users WHERE username = ? AND pass = ?";
        
        // Markaad isticmaasho await, xogta waxay si toos ah ugu dhacaysaa 'result'
        // Looma baahna (err, result) callback ah halkan
        const [result] = await conn.query(sql, [user, pass]);

        if (result.length > 0) {
            // Kaydi session-ka
            req.session.user = {
                userid: result[0].uid,
                username: result[0].username,
                userImage: result[0].image
            };
            // U dir bogga home
            return res.redirect("/home");
        } else {
            // Haddii login-ku khaldan yahay
            return res.send("invalid username or password");
        }
    } catch (err) {
        // Haddii ay jirto cillad database ama koodh
        console.error("LOGIN ERROR:", err.message);
        return res.status(500).send("Cillad farsamo ayaa dhacday: " + err.message);
    }
}); //end of login validation method
app.get("/api/session-user",(req,res)=>{
    if(!req.session.user)
        {return res.status(401).json({loggedIn:false})
    } // if condition
    res.json({
        loggedIn:true,username:req.session.user.username,
        id:req.session.user.userid,
        userImage:req.session.user.userImage
    })
})
app.get("/logout",(req,res)=>{
    req.session.destroy(()=>res.redirect("/user"))
}) // end of logout


app.get('/api/sidebar-menu', async (req, res) => {
    const sql = `
        SELECT 
            p.prid, p.prname AS parent_name, p.icon,
            s.sub_id, s.subname AS sub_name, s.href
        FROM privilage p
        LEFT JOIN sub_priv s ON p.prid = s.prid
        ORDER BY p.prid, s.sub_id;
    `;

    try {
        // Maadaama uu conn yahay promise, await ayaa loo isticmaalayaa
        const [results] = await conn.query(sql);

        const menu = [];
        results.forEach(row => {
            let parent = menu.find(m => m.prid === row.prid);
            
            if (!parent) {
                parent = {
                    prid: row.prid,
                    name: row.parent_name,
                    icon: row.icon,
                    submenus: []
                };
                menu.push(parent);
            }

            if (row.sub_id) {
                parent.submenus.push({
                    name: row.sub_name,
                    href: row.href
                });
            }
        });
        res.json(menu);
    } catch (err) {
        console.error("Sidebar Database Error:", err.message);
        res.status(500).json({ error: "Xogta Sidebar-ka lama soo saari karo" });
    }
});
// Universal Route oo loogu talagalay dhamaan boggaga dynamic-ga ah
app.get('/pages/:pageName', (req, res) => {
    const pageName = req.params.pageName; 
    const filePath = path.join(__dirname, 'public/pages', `${pageName}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Faylka lama helin:", pageName);
            // Hubi in 'path' uu require gareysan yahay dusha sare: const path = require('path');
            res.status(404).send("Boggaan laguma guuleysan in la helo.");
        }
    });
});

app.get('/api/get-addresses', async (req, res) => {
    // Hubi in qofku login yahay
    if (!req.session.user) {
        return res.status(401).json({ error: "Access denied" });
    }

    const sql = "SELECT add_no, CONCAT(district, ' - ', village, ' (', area, ')') AS full_address FROM address";
    try {
        const [results] = await conn.query(sql);
        res.json(results);
    } catch (err) {
        console.error("Cilad:", err.message);
        res.status(500).json({ error: "Cillad database" });
    }
});
app.post('/api/people/execute', async (req, res) => {
    // 1. Ka soo qaad xogta Frontend-ka
    const { pname, phone, psex, birDate, plbirth, addno, pgmail, rgdate, oper, num } = req.body;

    // 2. Wac Procedure-ka
    const sql = "CALL people(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    try {
        // Halkan waxaan ka saarnay callback-gii (err, results)
        const [results] = await conn.query(sql, [pname, phone, psex, birDate, plbirth, addno, pgmail, rgdate, oper, num]);

        // Procedure-ku wuxuu soo celiyaa dhowr natiijo, results[0] waa xogta dhabta ah
        const responseData = results[0]; 

        // 3. Haddii ay tahay Insert/Update/Delete, msg-ga ka soo saar
        if (oper !== 'select') {
            // Ka soo saar message-ka uu Procedure-ku soo celiyay (e.g. 'Already exists')
            const message = responseData[0].msg; 
            return res.json({ success: true, message: message });
        } else {
            // Haddii ay tahay select, u dir dhamaan xogta
            return res.json({ success: true, data: responseData });
        }
    } catch (err) {
        console.error("People Procedure Error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});
app.post('/api/universal/execute', async (req, res) => {
    try {
        const { table, oper, idName, idVal, data } = req.body;
        let cols = "";
        let vals = "";

        if (oper === 'insert') {
            cols = Object.keys(data).join(', ');
            vals = Object.values(data).map(v => `'${v}'`).join(', ');
        } else if (oper === 'update') {
            vals = Object.entries(data).map(([k, v]) => `${k}='${v}'`).join(', ');
        }

        // Halkan ayaan ka dhigay 'conn' sida aad codsatay
        await conn.execute(
            'CALL sp_UniversalCRUD(?, ?, ?, ?, ?, ?)',
            [table, oper, cols, vals, idName, idVal || 0]
        );

        return res.status(200).json({ success: true, message: "Guul!" });

    } catch (err) {
        // Kani wuxuu kaa badbaadinayaa 'Unhandled error event' crash-ka
        console.error("SQL ERROR:", err.sqlMessage || err.message); 
        return res.status(500).json({ success: false, message: err.message });
    }
});
app.listen(5000, () => {
    console.log("Server-ka wuxuu ku shaqeynayaa port 5000");
});