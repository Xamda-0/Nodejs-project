// const express = require("express");
// const path = require("path");

// const app = express();
// // const PORT = 3000;

// // static files
// app.use(express.static(path.join(__dirname, "public")))
// app.get("/home", (req, res) => {
//     res.sendFile(path.join(__dirname, "public", "index.html"));

// });

// app.listen(3000);

// // app.listen(PORT, () => {
// //   console.log(`Server running on http://localhost:${PORT}`);
// // });
let express=require("express");
let path=require("path");

let my=require("mysql2");
let session=require("express-session");
let app=express();
app.use(express.static("public"));
app.use(express.urlencoded({extended:false}));
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

// // routes/dashboard.js tusaale
// app.get("/api/tables", async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT table_name FROM information_schema.tables WHERE table_schema = 'staff_system'"
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
// app.get("/dashboard/table/:name", async (req, res) => {
//   const table = req.params.name;

//   const [rows] = await db.query(`SELECT * FROM ${table}`);
//   res.render("table-view", { table, rows });
// });
// Route: /api/sidebar-menu
app.get('/api/sidebar-menu', (req, res) => {
    const sql = `
        SELECT 
            p.prid, p.prname AS parent_name, p.icon,
            s.sub_id, s.subname AS sub_name, s.href
        FROM privilage p
        LEFT JOIN sub_priv s ON p.prid = s.prid
        ORDER BY p.prid, s.sub_id;
    `;

    db.query(sql, (err, results) => {
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
app.listen(5000)