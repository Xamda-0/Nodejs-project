
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
});

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

app.post("/log",(req,res)=>{
      let user=req.body.txt1
      let pass=req.body.txt2
      
    // if(user=="xamdi" && pass=="1234"){}
        let sql="select * from users where username=? and pass=?"
        conn.query(sql,[user,pass],(err,result)=>{
            if(err) return res.send(err)
            if(result.length>0){
                req.session.user={
                userid:result[0].uid,username:result[0].username,  userImage: result[0].image
                }
                res.redirect("/home")
            }
            else {
                res.send("invalid username or password")
            }
        }) //end of connections
}) //end of login validation method
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


app.get('/api/sidebar-menu', (req, res) => {
    const sql = `
        SELECT 
            p.prid, p.prname AS parent_name, p.icon,
            s.sub_id, s.subname AS sub_name, s.href
        FROM privilage p
        LEFT JOIN sub_priv s ON p.prid = s.prid
        ORDER BY p.prid, s.sub_id;
    `;

    conn.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        const menu = [];
        results.forEach(row => {
            // Halkan u fiirso: Waxaan isticmaalaynaa row.prid halkii ay ka ahayd row.pr_id
            let parent = menu.find(m => m.prid === row.prid);
            
            if (!parent) {
                parent = {
                    prid: row.prid,
                    name: row.parent_name, // Tan waa sidii hore (Alias-ka SQL)
                    icon: row.icon,
                    submenus: []
                };
                menu.push(parent);
            }

            if (row.sub_id) {
                parent.submenus.push({
                    name: row.sub_name, // Tan waa sidii hore (Alias-ka SQL)
                    href: row.href
                });
            }
        });
        res.json(menu);
    });
});
// Universal Route oo loogu talagalay dhamaan boggaga dynamic-ga ah
app.get('/pages/:pageName', (req, res) => {
    const pageName = req.params.pageName; // Tani waxay qabanaysaa 'people', 'staff', 'job' iwm.
    const filePath = path.join(__dirname, 'public/pages', `${pageName}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Faylka lama helin:", pageName);
            res.status(404).send("Boggaan laguma guuleysan in la helo.");
        }
    });
});
app.get('/api/get-addresses', (req, res) => {
    // Waxaan soo xulaynaa add_no iyo inta kale oo isku duuban
    const sql = "SELECT add_no, CONCAT(district, ' - ', village, ' (', area, ')') AS full_address FROM address";
    conn.query(sql, (err, results) => {
        if (err) {
            console.error("Cilad markii xogta address la keenayay:", err);
            return res.status(500).json({ error: "Xogta address-ka lama heli karo" });
        }
        res.json(results);
    });
});
app.post('/api/people/execute', (req, res) => {
    // Ka soo qaad xogta Frontend-ka
    const { pname, phone, psex, birDate, plbirth, addno, pgmail, rgdate, oper, num } = req.body;

    // Wac Procedure-ka: oper (Insert/Update/Delete), num (ID-ga loo baahan yahay)
    const sql = "CALL people(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    conn.query(sql, [pname, phone, psex, birDate, plbirth, addno, pgmail, rgdate, oper, num], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    // Procedure-ku wuxuu soo celiyaa dhowr natiijo
    // results[0] waa xogta (msg ama rows-ka)
    const responseData = results[0]; 

    // Haddii ay tahay Insert/Update/Delete, msg-ga ka soo saar
    if (oper !== 'select') {
        const message = responseData[0].msg; // Halkan ayay ku jirtaa 'Already exists' iwm.
        res.json({ success: true, message: message });
    } else {
        // Haddii ay tahay select, u dir dhamaan xogta
        res.json({ success: true, data: responseData });
    }
});
});
app.listen(5000)